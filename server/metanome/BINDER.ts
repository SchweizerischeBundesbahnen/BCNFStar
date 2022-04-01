import { absoluteServerDir, splitlines } from "../utils/files";
import { join } from "path";
import {
  access,
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  writeFile,
} from "fs/promises";

import MetanomeAlgorithm, { MetanomeConfig } from "./metanomeAlgorithm";
import { metanomeQueue, queueEvents } from "./queue";
import IInclusionDependency, {
  IColumnIdentifier,
} from "../definitions/IInclusionDependency";
import { splitTableString } from "../utils/databaseUtils";
import { sqlUtils } from "../db";

export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "results");
const OUTPUT_SUFFIX = "_inds_binder.json";

export default class BINDER extends MetanomeAlgorithm {
  constructor(tables: string[], config?: MetanomeConfig) {
    super(tables.sort(), config);
  }

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

  protected outputFileName(): string {
    return (
      this.schemaAndTables.map((table) => table.replace(".", "_")).join("_") +
      OUTPUT_SUFFIX
    );
  }

  public async moveFiles(): Promise<void> {
    try {
      await access("metanome/inds/");
    } catch (e) {
      await mkdir("metanome/inds");
    }
    try {
      return await rename(
        this.originalOutputPath(),
        "metanome/inds/" + this.schemaAndTables.join(",")
      );
    } catch (e) {
      // no file found, this likey means metanome didn't create a file
      // because there are no INDs. Therefore, create an empty file
      if (e.code == "ENOENT") {
        const handle = await open(
          "metanome/inds/" + this.schemaAndTables.join(","),
          "wx"
        );
        await handle.close();
      } else throw e;
    }
  }

  /**
   * Metanome outputs INDs as a file where every line is a JSON object
   * describing an IND. This function adds a schemaIdentifier to that
   * object and stores all of them as a JSON array
   */
  public async processFiles(): Promise<void> {
    const filename = `metanome/inds/${this.schemaAndTables}`;
    const content = await readFile(filename, { encoding: "utf-8" });
    const result: Array<IInclusionDependency> = splitlines(content).map(
      (line) => {
        let ind: IInclusionDependency;
        try {
          ind = JSON.parse(line);
        } catch (e) {
          console.log(e);
          console.log(line);
        }
        ind.dependant.columnIdentifiers.map((cc) =>
          splitTableIdentifier(cc, this.schemaAndTables)
        );
        ind.referenced.columnIdentifiers.map((cc) =>
          splitTableIdentifier(cc, this.schemaAndTables)
        );
        return ind;
      }
    );
    await writeFile(filename, JSON.stringify(result));
  }

  protected tableKey(): "INPUT_GENERATOR" | "INPUT_FILES" {
    return "INPUT_FILES";
  }

  public async getResults(): Promise<Array<IInclusionDependency>> {
    // find any file that includes INDs for the desired tables
    const possibleFiles = await readdir("metanome/inds");
    const goodFile = possibleFiles.find((filename) =>
      this.schemaAndTables.every((table) => filename.includes(table))
    );
    if (goodFile)
      return JSON.parse(
        await readFile("metanome/inds/" + goodFile, {
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
        config: { MAX_NARY_LEVEL: 2, DETECT_NARY: true },
      }
    );
    return job.waitUntilFinished(queueEvents);
  }
}

/**
 * This function takes a metanone result column identifier, which just
 * includes a table- and columnIdentifier, and adds a schemaIdentifier to it
 * @param cId column identifier obtained from metanome output
 * @param tablesWithSchema list of tables metanome was executed on
 */
function splitTableIdentifier(
  cId: IColumnIdentifier,
  tablesWithSchema: string[]
) {
  // Depending on the database type, tableIdentifier might contain both schema-
  // amd table name, or just the table name
  let tableWithSchema: string;
  if (sqlUtils.getDbmsName() == "mssql") tableWithSchema = cId.tableIdentifier;
  else if (sqlUtils.getDbmsName() == "postgres")
    tableWithSchema = tablesWithSchema.find((entry) => {
      const entryTable = splitTableString(entry)[1];
      return cId.tableIdentifier == entryTable;
    });
  else throw Error("unknown dbms type");

  cId.schemaIdentifier = splitTableString(tableWithSchema)[0];
  cId.tableIdentifier = splitTableString(tableWithSchema)[1];
}
