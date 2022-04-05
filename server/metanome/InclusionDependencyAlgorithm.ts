import { absoluteServerDir, splitlines } from "../utils/files";
import { join } from "path";
import { open, readFile, writeFile } from "fs/promises";

import MetanomeAlgorithm from "./metanomeAlgorithm";
import {
  IIndexFileEntry,
  MetanomeConfig,
} from "@/definitions/IIndexTableEntry";
import { isEqual } from "lodash";
import IInclusionDependency, {
  IColumnIdentifier,
} from "@/definitions/IInclusionDependency";
import { sqlUtils } from "../db";
import { splitTableString } from "../utils/databaseUtils";

export const OUTPUT_DIR = join(absoluteServerDir, "metanome", "results");

export default abstract class InclusionDependencyAlgorithm extends MetanomeAlgorithm {
  constructor(tables: string[], config?: MetanomeConfig) {
    super(tables.sort(), config);
  }

  public async moveFiles(): Promise<void> {
    try {
      super.moveFiles();
    } catch (e) {
      // no file found, this likey means metanome didn't create a file
      // because there are no results. Therefore, create an empty file
      if (e.code == "ENOENT") {
        const handle = await open(await this.resultPath(), "wx");
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
    const path = await this.resultPath();
    const content = await readFile(path, { encoding: "utf-8" });
    const result: Array<IInclusionDependency> = splitlines(content).map(
      (line) => {
        let ind: IInclusionDependency = JSON.parse(line);
        ind.dependant.columnIdentifiers.map((cc) =>
          splitTableIdentifier(cc, this.schemaAndTables)
        );
        ind.referenced.columnIdentifiers.map((cc) =>
          splitTableIdentifier(cc, this.schemaAndTables)
        );
        return ind;
      }
    );
    await writeFile(path, JSON.stringify(result));
  }

  /**
   * Tries to find INDs from existing results for this.schemaAndTables
   * @throws {code: 'EMOENT'} if nothing is found
   */
  public async getResults(): Promise<Array<IInclusionDependency>> {
    const file = await this.getMatchingFile();
    const content: Array<IInclusionDependency> = JSON.parse(
      await readFile(join(MetanomeAlgorithm.resultsFolder, file.fileName), {
        encoding: "utf-8",
      })
    );
    // if file contains additional tables, filter out ones that were not requested
    return content.filter(
      (ind) =>
        ind.dependant.columnIdentifiers.every((cc) =>
          this.schemaAndTables.includes(
            `${cc.schemaIdentifier}.${cc.tableIdentifier}`
          )
        ) &&
        ind.referenced.columnIdentifiers.every((cc) =>
          this.schemaAndTables.includes(
            `${cc.schemaIdentifier}.${cc.tableIdentifier}`
          )
        )
    );
  }

  /**
   * First tries to find a perfect match (results where the list of tables
   * is identical to this.schemaAndTables). If nothing is found, it tries to
   * find a file that contains INDs for a superset of the desired tables isntead.
   * @returns metadata of a file matching this algorithm and tables
   * @throws {error: 'EMOENT'} if nothing is found
   */
  protected async getMatchingFile(): Promise<IIndexFileEntry> {
    const possibleFiles = (await MetanomeAlgorithm.getIndexContent()).filter(
      (entry) => entry.algorithm === this.algoClass()
    );
    const perfectFile = possibleFiles.find((entry) =>
      isEqual(entry.tables, this.schemaAndTables)
    );
    // find any file that includes INDs for the desired tables
    const goodFile = possibleFiles.find((entry) =>
      this.schemaAndTables.every((table) => entry.tables.includes(table))
    );
    const file = perfectFile || goodFile;
    if (!file) throw { code: "ENOENT" };
    return file;
  }
}

/**
 * This function takes a metanome result column identifier, which just
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
