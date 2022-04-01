import { join } from "path";
import { access, mkdir, readFile, rename, writeFile } from "fs/promises";

import MetanomeAlgorithm, { MetanomeConfig } from "./metanomeAlgorithm";
import { absoluteServerDir, splitlines } from "../utils/files";
import { metanomeQueue, queueEvents } from "./queue";
import { splitTableString } from "../utils/databaseUtils";
import { sqlUtils } from "../db";
import IFunctionalDependency from "@/definitions/IFunctionalDependency";

export const METANOME_CLI_JAR_PATH = "metanome-cli-1.1.0.jar";
export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "temp");

export function outputPath(schemaAndTable: string): string {
  return join(OUTPUT_DIR, schemaAndTable + "-hyfd_extended.txt");
}

export default class Normi extends MetanomeAlgorithm {
  constructor(schemaAndTable: string, config?: MetanomeConfig) {
    super([schemaAndTable], config);
  }

  get schemaAndTable(): string {
    return this.schemaAndTables[0];
  }

  protected outputFileName(): string {
    return this.schemaAndTable;
  }

  protected override algoJarPath(): string {
    return "Normalize-1.2-SNAPSHOT.jar";
  }

  protected originalOutputPath(): string {
    const [, table] = splitTableString(this.schemaAndTable);
    return join(
      OUTPUT_DIR,
      sqlUtils.getDbmsName() == "mssql"
        ? this.schemaAndTable
        : table + "-hyfd_extended.txt"
    );
  }

  protected override algoClass(): string {
    return "de.metanome.algorithms.normalize.Normi";
  }

  protected resultOutputPath() {
    return `metanome/fds/${this.schemaAndTable}.json`;
  }

  protected tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_GENERATOR";
  }

  public async moveFiles(): Promise<void> {
    try {
      await access("metanome/fds/");
    } catch (e) {
      await mkdir("metanome/fds");
    }
    return rename(this.originalOutputPath(), this.resultOutputPath());
  }

  /**
   * Reads metanome output, converts it from Metanome FD strings to JSON
   * and saves it
   */
  public async processFiles(): Promise<void> {
    const content = await readFile(this.resultOutputPath(), {
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

    await writeFile(this.resultOutputPath(), JSON.stringify(mutatedContent));
  }

  public async getResults(): Promise<Array<IFunctionalDependency>> {
    return JSON.parse(
      await readFile(this.resultOutputPath(), {
        encoding: "utf-8",
      })
    );
  }

  async execute(): Promise<void> {
    let job = await metanomeQueue.add(
      `Getting functional dependencies for ${this.schemaAndTable}`,
      {
        schemaAndTables: [this.schemaAndTable],
        jobType: "fd",
        config: { isHumanInTheLoop: false },
      }
    );
    return job.waitUntilFinished(queueEvents);
  }
}
