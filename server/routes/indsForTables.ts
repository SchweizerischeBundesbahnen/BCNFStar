import { Request, Response, RequestHandler } from "express";
import { readFile } from "fs/promises";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";
import { split } from "../utils/databaseUtils";
import IInclusionDependency, {
  IColumnIdentifier,
} from "../definitions/IInclusionDependencies";

export default function getINDsForTablesFunction(): RequestHandler {
  async function getINDsForTables(req: Request, res: Response): Promise<void> {
    try {
      const tables: string[] = req.params.tableNames.split(",");

      const expectedOutputPath: string =
        MetanomeINDAlgorithm.outputPath(tables);
      const inds: IInclusionDependency[] = await readINDsFromFile(
        expectedOutputPath
      );

      inds.forEach((ind) => {
        ind.dependant.columnIdentifiers.forEach((column) =>
          splitTableIdentifier(column)
        );
        ind.referenced.columnIdentifiers.forEach((column) =>
          splitTableIdentifier(column)
        );
      });

      res.json(inds);
      res.status(200);
    } catch (error) {
      console.error(error);
      if (!res.headersSent)
        res.status(502).json({ error: "Could not get inds for table... " });
    }
  }
  return getINDsForTables;
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
