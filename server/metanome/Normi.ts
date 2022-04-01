import { join } from "path";
import { access, mkdir, readFile, rename } from "fs/promises";

import MetanomeAlgorithm, { MetanomeConfig } from "./metanomeAlgorithm";
import { absoluteServerDir } from "../utils/files";
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

  // location of the algorithm JAR relative to the package.json directory
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

  // location in the JAR where the algorithm is located
  protected override algoClass(): string {
    return "de.metanome.algorithms.normalize.Normi";
  }

  protected outputFileName(): string {
    return this.schemaAndTable;
  }

  protected tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_GENERATOR";
  }

  public async moveFiles(): Promise<void> {
    try {
      await access("/metanome/inds/");
    } catch (e) {
      mkdir("/metanome/inds");
    }
    rename(this.originalOutputPath(), "/metanome/fds/" + this.schemaAndTable);
  }

  public processFiles(): Promise<void> {
    throw Error("Not implemented!");
  }

  public async getResults(): Promise<Array<IFunctionalDependency>> {
    return JSON.parse(
      await readFile("/metanome/fds/" + this.schemaAndTable, {
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
        config: { humanInTheLoop: false },
      }
    );
    return job.waitUntilFinished(queueEvents);
  }
}
