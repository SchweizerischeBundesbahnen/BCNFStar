import { join } from "path";

import { absoluteServerDir, splitlines } from "@/utils/files";
import { splitTableString } from "@/utils/databaseUtils";
import FunctionalDependencyAlgorithm from "./FunctionalDependencyAlgorithm";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { IHyFD } from "@/definitions/IFunctionalDependency";

interface HyFDConfig {
  INPUT_ROW_LIMIT: number; //=-1
  // (assumption): checks if memory is nearly full, and writes to disk if so
  ENABLE_MEMORY_GUARDIAN: boolean; //=true
  NULL_EQUALS_NULL: boolean; //=true
  VALIDATE_PARALLEL: boolean; //=true
  MAX_DETERMINANT_SIZE: number; //=-1
}

// everything in here is still nonsense, I just wanted to document the available options
export default class HyFD extends FunctionalDependencyAlgorithm {
  protected override algoJarPath(): string {
    return "HyFD-1.2-SNAPSHOT.jar";
  }

  public override algoClass(): string {
    return "de.metanome.algorithms.hyfd.HyFD";
  }

  protected override tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_GENERATOR";
  }

  protected override originalOutputPath(): string {
    const [, table] = splitTableString(this.schemaAndTable);
    return join(
      absoluteServerDir,
      "metanome",
      "results",
      this.outputFileName() + "_fds"
    );
  }

  /**
   * Reads metanome output, converts it from Metanome FD strings to JSON
   * and saves it
   */
  public override async processFiles(): Promise<void> {
    const path = await this.resultPath();
    const fileStream = createReadStream(path, { encoding: "utf-8" });

    const lines = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    for await (const line of lines) {
      const fd: IHyFD = JSON.parse(line);
    }
  }
}
