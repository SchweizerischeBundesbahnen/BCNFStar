import { Request, Response } from "express";
import { access, rename } from "fs/promises";
import { join } from "path";
import promiseRetry from "promise-retry";
import { split } from "../utils/databaseUtils";
import { pathSplit } from "../utils/files";
import MetanomeFDAlgorithm from "../metanome/metanomeFDAlgorithm";

export default async function runMetanomeFD(
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

export async function runMetanomeFDAlgorithm(
  schemaAndTable: string
): Promise<void> {
  const algorithm = new MetanomeFDAlgorithm([schemaAndTable]);
  const metanomeOutputPaths = await algorithm.run();

  await renameMetanomeOutput(schemaAndTable, metanomeOutputPaths);
}

async function renameMetanomeOutput(
  schemaAndTable: string,
  metanomeOutputPaths: {}
) {
  const [schema, table] = split(schemaAndTable);
  const originPath = metanomeOutputPaths[table];
  const [path, filename] = pathSplit(originPath);
  const resultPath = join(path, schema + "." + filename);

  await promiseRetry(async (retry, attempt) => {
    if (attempt > 1)
      console.log("retrying renaming metanome reusults, attempt: " + attempt);
    try {
      await access(resultPath);
    } catch (e) {
      // correct file doesn't exist, try to create it
      const promise = rename(originPath, resultPath);
      return promise
        .catch((e) => {
          console.error(e);
          throw e;
        })
        .catch(retry);
    }
  });
}
