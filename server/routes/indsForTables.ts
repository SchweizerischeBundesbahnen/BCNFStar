import { Request, Response } from "express";
import { readFile } from "fs/promises";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";
import { splitTableString } from "../utils/databaseUtils";
import IInclusionDependency, {
  IColumnIdentifier,
} from "../definitions/IInclusionDependencies";
import { runMetanomeINDAlgorithm } from "./runMetanomeIND";

export default async function getINDsForTables(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tables: string[] = req.params.tableNames.split(",").sort();
    const expectedOutputPath: string = MetanomeINDAlgorithm.outputPath(tables);
    //  Try to send existing INDs. If not found, execute metanome IND discovery and try again
    try {
      await sendINDs(expectedOutputPath, tables);
    } catch (err) {
      if (err.code === "ENOENT") {
        await runMetanomeINDAlgorithm(tables);
        await sendINDs(expectedOutputPath, tables);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(err);
    if (!res.headersSent)
      res.status(502).json({ error: "Could not get inds for table... " });
  }

  async function sendINDs(
    expectedOutputPath: string,
    tablesWithSchema: string[]
  ) {
    const inds: IInclusionDependency[] = await readINDsFromFile(
      expectedOutputPath
    );
    inds.forEach((ind) => {
      ind.dependant.columnIdentifiers.forEach((column) =>
        splitTableIdentifier(column, tablesWithSchema)
      );
      ind.referenced.columnIdentifiers.forEach((column) =>
        splitTableIdentifier(column, tablesWithSchema)
      );
    });
    console.log("inds", inds);
    res.json(inds);
    res.status(200);
  }
}

async function readINDsFromFile(path: string): Promise<IInclusionDependency[]> {
  const result = await readFile(path, "utf8");
  return result
    .trim()
    .split(/\r?\n/)
    .map((json_strings) => JSON.parse(json_strings) as IInclusionDependency);
}

/**
 * Takes a ColumnIdentifier from a BINDER output and creates separate schema-
 * and tableIdentifiers from the original tableIdentifier
 *
 * @param cId
 * @param tablesWithSchema
 */
function splitTableIdentifier(
  cId: IColumnIdentifier,
  tablesWithSchema: string[]
) {
  // Depending on the database type, tableIdentifier might contain both schema-
  // amd table name, or just the table name
  const tableWithSchema = tablesWithSchema.find((entry) => {
    const entryTable = splitTableString(entry)[1];
    return cId.tableIdentifier == entry || cId.tableIdentifier == entryTable;
  });
  cId.schemaIdentifier = splitTableString(tableWithSchema)[0];
  cId.tableIdentifier = splitTableString(tableWithSchema)[1];
}
