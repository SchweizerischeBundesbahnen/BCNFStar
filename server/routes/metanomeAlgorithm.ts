import { absoluteServerDir } from "../utils/files";
import { promisify } from "util";
import { exec } from "child_process";
import { join } from "path";
import { sqlUtils } from "../db";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
}

export default class MetanomeAlgorithm {
  public memory = "12g";
  private tables: string[];
  constructor(tables: string[]) {
    this.tables = tables;
  }
  async run(): Promise<{}> {
    const asyncExec = promisify(exec);
    this.tables.forEach(async (table) => {
      console.log("Executing metanome on " + table);
      const { stderr, stdout } = await asyncExec(this.command(table), {
        cwd: "metanome/",
      });
      console.log(`Metanome execution on ${table} finished`);
      // console.log(result.stdout);
      if (stderr) console.error(stderr);
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
    return [
      METANOME_CLI_JAR_PATH,
      sqlUtils.getJdbcPath(),
      this.algoJarPath(),
    ].join(classpath_separator);
  }

  // location of the algorithm JAR relative to the package.json directory
  private algoJarPath(): string {
    return "Normalize-1.2-SNAPSHOT.jar";
  }

  private pgpassPath(): string {
    if (process.env.DB_PASSFILE == undefined) {
      throw new Error("missing DB_PASSFILE in env.local");
    }
    return process.env.DB_PASSFILE;
  }

  // location in the JAR where the algorithm is located
  private algoClass(): string {
    return "de.metanome.algorithms.normalize.Normi";
  }
  private command(table: string): string {
    return `java -Xmx${
      this.memory
    } -cp "${this.classpath()}" de.metanome.cli.App --algorithm ${this.algoClass()} --db-connection ${this.pgpassPath()} --db-type ${
      process.env.DB_TYPE
    } --table-key "INPUT_GENERATOR" --tables ${table} --output file:${table}_normalize_results.json --algorithm-config isHumanInTheLoop:false`;
  }
}
