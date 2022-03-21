import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { Request, Response } from "express";
import { readFile } from "fs/promises";
import MetanomeFDAlgorithm from "../metanome/metanomeFDAlgorithm";

export default async function getFDsFromTableName(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaAndTable = req.params.name;
    const expectedOutputPath = MetanomeFDAlgorithm.outputPath(schemaAndTable);
    try {
      await sendFDs(schemaAndTable, expectedOutputPath);
    } catch (err) {
      // means file not found
      if (err.code === "ENOENT") {
        await new MetanomeFDAlgorithm([schemaAndTable]).run();
        await sendFDs(schemaAndTable, expectedOutputPath);
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res.status(502).json({ error: "Could not get fds for table... " });
  }

  async function sendFDs(schemaAndTable: string, expectedOutputPath: string) {
    const fds: IFunctionalDependencies = {
      tableName: schemaAndTable,
      functionalDependencies: await readFDsFromFile(expectedOutputPath),
    };
    res.status(200).send(fds);
  }
}

async function readFDsFromFile(path: string): Promise<string[]> {
  const result = await readFile(path, "utf8");
  return result.trim().split(/\r?\n/);
}
