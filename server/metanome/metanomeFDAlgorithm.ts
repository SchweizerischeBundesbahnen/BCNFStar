import { absoluteServerDir } from "../utils/files";
import { promisify } from "util";
import { exec } from "child_process";
import { join } from "path";
import { sqlUtils } from "../db";
import MetanomeAlgorithm from "./metanomeAlgorithm";
import { assert } from "console";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
}

export default class MetanomeFDAlgorithm extends MetanomeAlgorithm {
  constructor(tables: string[]) {
    super(tables);
  }
  async run(): Promise<{}> {
    const asyncExec = promisify(exec);
    for (const table of this.tables) {
      console.log("Executing metanome on " + table);
      const { stderr, stdout } = await asyncExec(this.command([table]), {
        cwd: "metanome/",
      });
      console.log(`Metanome execution on ${table} finished`);
      if (stderr) {
        console.error(stderr);
        throw Error("Metanome execution failed");
      }
    }

    let dict = {};
    this.tables
      .map((schemaAndTable) => schemaAndTable.split(".")[1])
      .forEach(
        (table) =>
          (dict[table] = join(OUTPUT_DIR, table + "-hyfd_extended.txt"))
      );
    return dict;
  }

  // location of the algorithm JAR relative to the package.json directory
  protected override algoJarPath(): string {
    return "Normalize-1.2-SNAPSHOT.jar";
  }

  public static outputPath(schemaAndTable: string): string {
    return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
  }

  // location in the JAR where the algorithm is located
  protected override algoClass(): string {
    return "de.metanome.algorithms.normalize.Normi";
  }

  protected override command(table: string[]): string {
    assert(table.length == 1);
    return `java -Xmx${
      this.memory
    } -cp "${this.classpath()}" de.metanome.cli.App --algorithm ${this.algoClass()} --db-connection ${this.dbPassPath()} --db-type ${
      process.env.DB_TYPE
    } --table-key "INPUT_GENERATOR" --tables ${table[0]} --output file:${
      table[0]
    }_normalize_results.json --algorithm-config isHumanInTheLoop:false`;
  }
}
