import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { table } from "console";
import { Request, Response, RequestHandler } from "express";
import { rename } from "fs/promises";
import { join } from "path";
import { split } from "../utils/databaseUtils";
import { pathSplit } from "../utils/files";
import MetanomeAlgorithm from "../metanome/metanomeAlgorithm";

export default function postRunMetanomeFDAlgorithmFunction(): RequestHandler {
  async function MetanomeFDAlgorithm(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const schemaAndTable = req.params.name;
      await runMetanomeFDAlgorithm(schemaAndTable);
      res.status(200).json({ message: "success!" });
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not run algorithm" });
    }
  }
  return MetanomeFDAlgorithm;
}

export async function runMetanomeFDAlgorithm(
  schemaAndTable: string
): Promise<void> {
  const algorithm = new MetanomeAlgorithm([schemaAndTable]);
  const metanomeOutputPaths = await algorithm.run();

  // TODO: .....
  await new Promise((r) => setTimeout(r, 500));

  await renameMetanomeOutput(schemaAndTable, metanomeOutputPaths);
}

async function renameMetanomeOutput(
  schemaAndTable: string,
  metanomeOutputPaths: {}
) {
  const [schema, table] = split(schemaAndTable);
  const [path, filename] = pathSplit(metanomeOutputPaths[table]);

  await rename(metanomeOutputPaths[table], join(path, schema + "." + filename));
}
