import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { table } from "console";
import e, { Request, Response, RequestHandler } from "express";
import { access, open, rename } from "fs/promises";
import { join } from "path";
import promiseRetry from "promise-retry";
import { split } from "../utils/databaseUtils";
import { pathSplit } from "../utils/files";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";

export default function postRunMetanomeINDAlgorithmFunction(): RequestHandler {
  async function MetanomeINDAlgorithm(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const tables: string[] = req.body.tables;
      console.log(tables);
      await runMetanomeINDAlgorithm(tables);
      res.status(200).json({ message: "success!" });
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not run algorithm" });
    }
  }
  return MetanomeINDAlgorithm;
}

export async function runMetanomeINDAlgorithm(tables: string[]): Promise<void> {
  const algorithm = new MetanomeINDAlgorithm(tables);
  const metanomeOutputPaths = await algorithm.run();
}
