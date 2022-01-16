import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { table } from "console";
import { Request, Response, RequestHandler } from "express";
import { readFileSync, existsSync, access, constants } from "fs";
import MetanomeAlgorithm from "../metanome/metanomeAlgorithm";
import { outputPath } from "../metanome/metanomeAlgorithm";
import postRunMetanomeFDAlgorithmFunction, {
  runMetanomeFDAlgorithm,
} from "./runMetanome";

export default function getFDsFromTableNameFunction(): RequestHandler {
  async function getFDsFromTableName(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const schemaAndTable = req.params.name;
      const expectedOutputPath = outputPath(schemaAndTable);

      try {
        const fds: IFunctionalDependencies = {
          tableName: schemaAndTable,
          functionalDependencies: readFDsFromFile(expectedOutputPath),
        };
        res.status(200).send(fds);
      } catch (e) {
        res.json(
          "Missing fds. Running Metanome-Algorithm. Ask again in 69h ... ;-)"
        );
        await runMetanomeFDAlgorithm(schemaAndTable);
      }
    } catch (error) {
      console.error(error);
      if (!res.headersSent)
        res.status(502).json({ error: "Could not get fds for table... " });
    }
  }
  return getFDsFromTableName;
}

function readFDsFromFile(path: string): string[] {
  return readFileSync(path, "utf8").toString().trim().split(/\r?\n/);
}
