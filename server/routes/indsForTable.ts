import { Request, Response, RequestHandler } from "express";
import { readFile } from "fs/promises";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";
import { split } from "../utils/databaseUtils";
import IInclusionDependency, {
  IColumnIdentifier,
} from "../definitions/IInclusionDependencies";

export default function getINDsForTableFunction(): RequestHandler {
  async function getINDsForTable(req: Request, res: Response): Promise<void> {
    try {
      const schemaAndTable: string = req.params.name;
      const expectedOutputPath: string[] =
        MetanomeINDAlgorithm.outputPaths(schemaAndTable);
      let inds: IInclusionDependency[] = [];
      for (let i: number = 0; i < expectedOutputPath.length; i++) {
        inds = inds.concat(
          await getRelevantInds(expectedOutputPath[i], schemaAndTable)
        );
      }
      res.json(inds);
      res.status(200);
    } catch (error) {
      console.error(error);
      if (!res.headersSent)
        res.status(502).json({ error: "Could not get inds for table... " });
    }
  }
  return getINDsForTable;
}

async function getRelevantInds(
  path: string,
  schemaAndTable: string
): Promise<IInclusionDependency[]> {
  const binderINDs: IInclusionDependency[] = await readINDsFromFile(path);
  binderINDs
    .filter(
      (ind) =>
        ind.dependant.columnIdentifiers[0].tableIdentifier == schemaAndTable ||
        ind.referenced.columnIdentifiers[0].tableIdentifier == schemaAndTable
    )
    .forEach((ind) => {
      ind.dependant.columnIdentifiers.forEach((column) =>
        splitTableIdentifier(column)
      );
      ind.referenced.columnIdentifiers.forEach((column) =>
        splitTableIdentifier(column)
      );
    });
  return binderINDs;
}

async function readINDsFromFile(path: string): Promise<IInclusionDependency[]> {
  const result = await readFile(path, "utf8");
  return result
    .trim()
    .split(/\r?\n/)
    .map((json_strings) => JSON.parse(json_strings) as IInclusionDependency);
}

function splitTableIdentifier(column: IColumnIdentifier) {
  column.schemaIdentifier = split(column.tableIdentifier)[0];
  column.tableIdentifier = split(column.tableIdentifier)[1];
}
