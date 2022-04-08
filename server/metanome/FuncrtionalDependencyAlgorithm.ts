import { join } from "path";
import { readFile } from "fs/promises";

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

  public override async getResults(): Promise<Array<IFunctionalDependency>> {
    const content = await readFile(await this.resultPath(), {
      encoding: "utf-8",
    });
    return splitlines(content).map((fd) => JSON.parse(fd));
  }
}
