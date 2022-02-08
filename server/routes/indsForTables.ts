import { Request, Response } from "express";
import { readFile } from "fs/promises";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";
import { split } from "../utils/databaseUtils";
import IInclusionDependency, {
  IColumnIdentifier,
} from "../definitions/IInclusionDependencies";
import { runMetanomeINDAlgorithm } from "./runMetanomeIND";

export default async function getINDsForTables(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tables: string[] = req.params.tableNames.split(",");
    const expectedOutputPath: string = MetanomeINDAlgorithm.outputPath(tables);
    try {
      await sendINDs(expectedOutputPath);
    } catch (err) {
      // means file not found
      if (err.code === "ENOENT") {
        await runMetanomeINDAlgorithm(tables);
        await sendINDs(expectedOutputPath);
      } else {
        throw err;
      }
    }
  } catch (err) {
    if (!res.headersSent)
      res.status(502).json({ error: "Could not get inds for table... " });
  }

  async function sendINDs(expectedOutputPath: string) {
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
  }
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
