import { absoluteServerDir, splitlines } from "../utils/files";
import { join } from "path";
import { open, readFile } from "fs/promises";

import MetanomeAlgorithm, { MetanomeConfig } from "./metanomeAlgorithm";
import { isEqual } from "lodash";
import IInclusionDependency from "@/definitions/IInclusionDependency";
import { getIndexContent } from "./IndexFile";
import { IIndexFileEntry } from "@/definitions/IIndexTableEntry";

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
   * Tries to find INDs from existing results for this.schemaAndTables
   * @throws {code: 'EMOENT'} if nothing is found
   */
  public async getResults(): Promise<Array<IInclusionDependency>> {
    const fileEntry: IIndexFileEntry = await this.getMatchingFile();
    const fileContent: string = await readFile(
      join(MetanomeAlgorithm.resultsFolder, fileEntry.fileName),
      { encoding: "utf-8" }
    );
    const content: Array<IInclusionDependency> = splitlines(fileContent).map(
      (v) => JSON.parse(v)
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
   * @throws {error: 'ENOENT'} if nothing is found
   */
  protected async getMatchingFile(): Promise<IIndexFileEntry> {
    const possibleFiles = (await getIndexContent()).filter(
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
