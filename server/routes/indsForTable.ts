import { Request, Response, RequestHandler } from "express";
import { readFile } from "fs/promises";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";
import { split } from "../utils/databaseUtils";
import BinderInclusionDependency, {
  ColumnIdentifier,
} from "../definitions/IBinderInclusionDependencies";

export default function getINDsForTableFunction(): RequestHandler {
  async function getINDsForTable(req: Request, res: Response): Promise<void> {
    try {
      const schemaAndTable: string = req.params.name;
      const expectedOutputPath: string[] =
        MetanomeINDAlgorithm.outputPath(schemaAndTable);

      let inds: BinderInclusionDependency[] = [];
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
): Promise<BinderInclusionDependency[]> {
  const binderINDs: BinderInclusionDependency[] = await readINDsFromFile(path);
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

async function readINDsFromFile(
  path: string
): Promise<BinderInclusionDependency[]> {
  const result = await readFile(path, "utf8");
  return result
    .trim()
    .split(/\r?\n/)
    .map(
      (json_strings) => JSON.parse(json_strings) as BinderInclusionDependency
    );
}

function splitTableIdentifier(column: ColumnIdentifier) {
  column.schemaIdentifier = split(column.tableIdentifier)[0];
  column.tableIdentifier = split(column.tableIdentifier)[1];
}
