import { absoluteServerDir } from "../utils/files";
import { promisify } from "util";
import { exec } from "child_process";
import { join } from "path";
import { sqlUtils } from "../db";
import MetanomeAlgorithm from "./metanomeAlgorithm";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-binder.txt");
}

export default class MetanomeINDAlgorithm extends MetanomeAlgorithm {
  constructor(tables: string[]) {
    super(tables);
  }
  async run(): Promise<{}> {
    const asyncExec = promisify(exec);
    console.log("Executing binder for inds on " + this.tables);
    const { stderr, stdout } = await asyncExec(this.command(this.tables), {
      cwd: "metanome/",
    });
    console.log(`Binder execution on ${this.tables} finished`);
    if (stderr) {
      console.error(stderr);
      throw Error("Metanome execution failed");
    }

    let dict = {};
    dict[this.tables.join("_")] = join(
      OUTPUT_DIR,
      this.outputFileName(this.tables)
    );
    return dict;
  }

  // location of the algorithm JAR relative to the package.json directory
  protected algoJarPath(): string {
    return "BINDERFile.jar";
  }

  // location in the JAR where the algorithm is located
  protected algoClass(): string {
    return "de.metanome.algorithms.binder.BINDERFile";
  }

  private outputFileName(tables: string[]): string {
    const suffix = "_inds_binder.json";
    return "test" + suffix;
  }

  protected command(tables: string[]): string {
    return `java -Xmx${this.memory} -cp "${this.classpath()}"
    de.metanome.cli.App --algorithm ${this.algoClass()} --db-connection ${this.dbPassPath()} --db-type ${
      process.env.DB_TYPE
    } --table-key "INPUT_FILES" --header  --tables ${tables.join(
      ","
    )} --output file:${this.outputFileName(tables)}`;
  }
}
