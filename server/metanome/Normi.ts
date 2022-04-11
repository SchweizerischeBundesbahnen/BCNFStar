import { join } from "path";

import { absoluteServerDir, splitlines } from "../utils/files";
import { metanomeQueue, queueEvents } from "./queue";
import { splitTableString } from "../utils/databaseUtils";
import { sqlUtils } from "../db";
import FunctionalDependencyAlgorithm from "./FunctionalDependencyAlgorithm";
import { readFile, writeFile } from "fs/promises";
import { MetanomeConfig } from "./metanomeAlgorithm";

const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

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

  protected override tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_GENERATOR";
  }

  protected override originalOutputPath(): string {
    const [, table] = splitTableString(this.schemaAndTable);
    return join(
      OUTPUT_DIR,
      (sqlUtils.getDbmsName() == "mssql" ? this.schemaAndTable : table) +
        "-hyfd_extended.txt"
    );
  }

  /**
   * Reads metanome output, converts it from Metanome FD strings to JSON
   * and saves it
   */
  public override async processFiles(): Promise<void> {
    const path = await this.resultPath();
    const content = await readFile(path, {
      encoding: "utf-8",
    });
    //  format of fdString: "[c_address, c_anothercol] --> c_acctbal, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone"
    const result: Array<string> = splitlines(content)
      .map((fdString) => {
        const [lhsString, rhsString] = fdString.split(" --> ");
        return {
          lhsColumns: lhsString
            // remove brackets
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim()),
          rhsColumns: rhsString.split(",").map((s) => s.trim()),
        };
      })
      .map((fd) => JSON.stringify(fd));

    await writeFile(path, result.join("\n"));
  }

  async execute(): Promise<void> {
    let job = await metanomeQueue.add(
      `Getting functional dependencies for ${this.schemaAndTable}`,
      {
        schemaAndTables: [this.schemaAndTable],
        jobType: "fd",
        config: Object.assign({ isHumanInTheLoop: false }, this.config),
      }
    );
    return job.waitUntilFinished(queueEvents);
  }
}
