import { absoluteServerDir } from "../utils/files";
import { join } from "path";

import { MetanomeConfig } from "@/definitions/IIndexTableEntry";
import { metanomeQueue, queueEvents } from "./queue";
import InclusionDependencyAlgorithm from "./InclusionDependencyAlgorithm";

export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "results");

export default class BINDER extends InclusionDependencyAlgorithm {
  protected algoJarPath(): string {
    return "BINDERFile.jar";
  }

  protected algoClass(): string {
    return "de.metanome.algorithms.binder.BINDERFile";
  }

  /**
   * @returns path where metanome put the results initially
   */
  protected originalOutputPath(): string {
    return join(OUTPUT_DIR, this.outputFileName() + "_inds");
  }

  protected tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_FILES";
  }

  async execute(config: MetanomeConfig): Promise<void> {
    if (config.memory && typeof config.memory == "string")
      this.memory = config.memory;
    let job = await metanomeQueue.add(
      `Getting inclusion dependencies for ${this.schemaAndTables}`,
      {
        schemaAndTables: this.schemaAndTables,
        jobType: "ind",
        config: Object.assign({ MAX_NARY_LEVEL: 2, DETECT_NARY: true }, config),
      }
    );
    return job.waitUntilFinished(queueEvents);
  }
}
