import { absoluteServerDir } from "../utils/files";
import { join } from "path";
import MetanomeAlgorithm, { MetanomeConfig } from "./metanomeAlgorithm";
import { metanomeQueue, queueEvents } from "./queue";
import { access, mkdir, readdir, readFile, rename } from "fs/promises";
import IInclusionDependency from "@/definitions/IInclusionDependency";

export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "results");
const OUTPUT_SUFFIX = "_inds_binder.json";

export default class BINDER extends MetanomeAlgorithm {
  constructor(tables: string[], config?: MetanomeConfig) {
    super(tables.sort(), config);
  }

  protected algoJarPath(): string {
    return "BINDERFile.jar";
  }

  // location in the JAR where the algorithm is located
  protected algoClass(): string {
    return "de.metanome.algorithms.binder.BINDERFile";
  }

  // returns all files, that could contain relevant INDs for the table
  public outputPath(): string {
    return join(OUTPUT_DIR, this.outputFileName() + "_inds");
  }

  protected outputFileName(): string {
    return (
      this.schemaAndTables.map((table) => table.replace(".", "_")).join("_") +
      OUTPUT_SUFFIX
    );
  }

  public async moveFiles(): Promise<void> {
    try {
      await access("/metanome/inds/");
    } catch (e) {
      mkdir("/metanome/inds");
    }
    rename(
      this.outputPath(),
      "/metanome/inds/" + this.schemaAndTables.join(",")
    );
  }

  public processFiles(): Promise<void> {
    throw Error("Not implemented");
  }

  protected tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_FILES";
  }

  public async getResults(): Promise<Array<IInclusionDependency>> {
    const possibleFiles = await readdir("/metanome/inds");
    const goodFile = possibleFiles.find((filename) =>
      this.schemaAndTables.every((table) => filename.includes(table))
    );
    if (goodFile)
      return JSON.parse(
        await readFile("/metanome/fds/" + this.schemaAndTables[0], {
          encoding: "utf-8",
        })
      );
    else throw { code: "ENOENT" };
  }

  async execute(): Promise<void> {
    let job = await metanomeQueue.add(
      `Getting inclusion dependencies for ${this.schemaAndTables}`,
      {
        schemaAndTables: this.schemaAndTables,
        jobType: "ind",
        config: { MAX_NARY: 2, ENABLE_NARY: true },
      }
    );
    return job.waitUntilFinished(queueEvents);
  }
}
