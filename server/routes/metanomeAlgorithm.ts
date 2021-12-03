import { absoluteServerDir } from "../utils/files";
import { promisify } from "util";
import { exec } from "child_process";
import { join, dirname } from "path";
import { toNamespacedPath } from "path/posix";

export const METANOME_CLI_JAR_PATH = "metanome/metanome-cli-1.1.0.jar";
export const POSTGRES_JDBC_JAR_PATH = "metanome/postgresql-9.3-1102-jdbc41.jar";
export const PGPASS_PATH = process.env.PGPASSFILE;
export const OUTPUT_DIR = join(absoluteServerDir, "temp");

export default class MetanomeAlgorithm {
  public memory = "12g";
  private tables: string[];
  constructor(tables: string[]) {
    this.tables = tables;
  }
  async run(): Promise<{}> {
    const asyncExec = promisify(exec);
    this.tables.forEach(async (table) => {
      await asyncExec(this.command(table));
    });

    let dict = {};
    this.tables
      .map((schemaAndTable) => schemaAndTable.split(".")[1])
      .forEach(
        (table) =>
          (dict[table] = join(OUTPUT_DIR, table + "-hyfd_extended.txt"))
      );
    return dict;
  }

  private classpath(): string {
    const classpath_separator = process.platform === "win32" ? ";" : ":";
    return [METANOME_CLI_JAR_PATH, POSTGRES_JDBC_JAR_PATH, this.algoJarPath()]
      .map((jarpath) => absoluteServerDir + "/" + jarpath)
      .join(classpath_separator);
  }

  // location of the algorithm JAR relative to the package.json directory
  private algoJarPath(): string {
    return "/metanome/Normalize-1.2-SNAPSHOT.jar";
  }

  private pgpassPath(): string {
    if (PGPASS_PATH == undefined) {
      throw new Error("missing PG_PASSFILE in env.local");
    }
    return PGPASS_PATH;
  }

  // location in the JAR where the algorithm is located
  private algoClass(): string {
    return "de.metanome.algorithms.normalize.Normi";
  }
  private command(table: string): string {
    return `java -Xmx${
      this.memory
    } -cp "${this.classpath()}" de.metanome.cli.App --algorithm ${this.algoClass()} --db-connection ${this.pgpassPath()} --db-type postgresql --table-key "INPUT_GENERATOR" --tables ${table} --output file:${table}_results.json --algorithm-config isHumanInTheLoop:false`;
  }
}
