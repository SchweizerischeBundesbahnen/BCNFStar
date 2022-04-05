import { join } from "path";
import { readFile, writeFile } from "fs/promises";

import MetanomeAlgorithm from "./metanomeAlgorithm";
import { MetanomeConfig } from "@/definitions/IIndexTableEntry";
import { absoluteServerDir, splitlines } from "../utils/files";
import IFunctionalDependency from "@/definitions/IFunctionalDependency";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
}

export default abstract class FunctionalDependencyAlgorithm extends MetanomeAlgorithm {
  constructor(schemaAndTable: string, config?: MetanomeConfig) {
    super([schemaAndTable], config);
  }

  get schemaAndTable(): string {
    return this.schemaAndTables[0];
  }

  /**
   * Reads metanome output, converts it from Metanome FD strings to JSON
   * and saves it
   */
  public async processFiles(): Promise<void> {
    const path = await this.resultPath();
    const content = await readFile(path, {
      encoding: "utf-8",
    });
    //  format of fdString: "[c_address, c_anothercol] --> c_acctbal, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone"
    const mutatedContent: Array<IFunctionalDependency> = splitlines(
      content
    ).map((fdString) => {
      const [lhsString, rhsString] = fdString.split(" --> ");
      return {
        lhsColumns: lhsString
          // remove brackets
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim()),
        rhsColumns: rhsString.split(",").map((s) => s.trim()),
      };
    });

    await writeFile(path, JSON.stringify(mutatedContent));
  }

  public async getResults(): Promise<Array<IFunctionalDependency>> {
    return JSON.parse(
      await readFile(await this.resultPath(), {
        encoding: "utf-8",
      })
    );
  }
}
