import { absoluteServerDir } from "../utils/files";
import { promisify } from "util";
import { exec } from "child_process";
import { join } from "path";
import { sqlUtils } from "../db";
import MetanomeAlgorithm from "./metanomeAlgorithm";
import fs from "fs";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "results");
const OUTPUT_SUFFIX = "_inds_binder.json_inds";

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
    console.log(this.command(this.tables));
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

  public static outputPath(schemaAndTable: string): string[] {
    const files: string[] = fs.readdirSync(OUTPUT_DIR);
    return files
      .filter(
        (file) =>
          file.endsWith(OUTPUT_SUFFIX) &&
          file.includes(schemaAndTable.replace(".", "_"))
      )
      .map((file) => join(OUTPUT_DIR, file));
  }

  private outputFileName(tables: string[]): string {
    return (
      tables.map((table) => table.replace(".", "_")).join("_") + OUTPUT_SUFFIX
    );
  }

  protected command(tables: string[]): string {
    return `java -Xmx${
      this.memory
    } -cp "${this.classpath()}" de.metanome.cli.App --algorithm ${this.algoClass()} --db-connection ${this.dbPassPath()} --db-type ${
      process.env.DB_TYPE
    } --table-key "INPUT_FILES" --header  --tables ${tables.join(
      ","
    )} --output file:${this.outputFileName(tables)}`.replace(
      /(\r\n|\n|\r)/gm,
      ""
    );
  }
}
