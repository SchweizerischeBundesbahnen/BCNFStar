import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { table } from "console";
import { Request, Response, RequestHandler } from "express";
import { readFileSync, rename } from "fs";
import { join } from 'path';
import { split } from "../utils/databaseUtils";
import { pathSplit } from "../utils/files";
import MetanomeAlgorithm from "./metanomeAlgorithm";

export default function postRunMetanomeFDAlgorithmFunction(): RequestHandler {
  async function MetanomeFDAlgorithm(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const schemaAndTable = req.params.name;
      await runMetanomeFDAlgorithm(schemaAndTable);
      res.json();
      res.status(200);
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not run algorithm" });
      res.status(502);
    }
  }
  return MetanomeFDAlgorithm;
}

export async function runMetanomeFDAlgorithm(schemaAndTable: string) {
  const algorithm = new MetanomeAlgorithm([schemaAndTable]);
  const metanomeOutputPaths = await algorithm.run();

  // TODO: ..... 
  await new Promise((resolve) => setTimeout(resolve, 1000));

  renameMetanomeOutput(schemaAndTable, metanomeOutputPaths);
}

function renameMetanomeOutput(schemaAndTable: string, metanomeOutputPaths: {}) {
  const [schema, table] = split(schemaAndTable);
  const [path, filename] = pathSplit(metanomeOutputPaths[table]);

  rename(metanomeOutputPaths[table], join(path, schema + '.' + filename), function (err) {
    if (err) throw Error('ERROR: ' + err);
  });
}
