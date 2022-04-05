import { join } from "path";

import { MetanomeConfig } from "@/definitions/IIndexTableEntry";
import { absoluteServerDir } from "../utils/files";
import { metanomeQueue, queueEvents } from "./queue";
import { splitTableString } from "../utils/databaseUtils";
import { sqlUtils } from "../db";
import FunctionalDependencyAlgorithm from "./FuncrtionalDependencyAlgorithm";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
}

export default class Normi extends FunctionalDependencyAlgorithm {
  protected override algoJarPath(): string {
    return "Normalize-1.2-SNAPSHOT.jar";
  }

  protected override algoClass(): string {
    return "de.metanome.algorithms.normalize.Normi";
  }

  protected originalOutputPath(): string {
    const [, table] = splitTableString(this.schemaAndTable);
    return join(
      OUTPUT_DIR,
      (sqlUtils.getDbmsName() == "mssql" ? this.schemaAndTable : table) +
        "-hyfd_extended.txt"
    );
  }

  protected tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_GENERATOR";
  }

  async execute(config: MetanomeConfig): Promise<void> {
    if (config.memory && typeof config.memory == "string")
      this.memory = config.memory;
    let job = await metanomeQueue.add(
      `Getting functional dependencies for ${this.schemaAndTable}`,
      {
        schemaAndTables: [this.schemaAndTable],
        jobType: "fd",
        config: Object.assign({ isHumanInTheLoop: false }, config),
      }
    );
    return job.waitUntilFinished(queueEvents);
  }
}
