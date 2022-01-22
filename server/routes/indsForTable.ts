import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { Request, Response, RequestHandler } from "express";
import { readFile } from "fs/promises";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";
import { runMetanomeFDAlgorithm } from "./runMetanomeFD";
import { split } from "../utils/databaseUtils";
import IInd from "@/definitions/IInd";

export default function getINDsForTableFunction(): RequestHandler {
  async function getINDsForTable(req: Request, res: Response): Promise<void> {
    try {
      const schemaAndTable: string = req.params.name;
      const expectedOutputPath: string[] =
        MetanomeINDAlgorithm.outputPath(schemaAndTable);
      // console.log(expectedOutputPath)
      const [table, schema] = split(schemaAndTable);
      let inds: IInd[] = [];
      console.log("expectedOutputPath: ", expectedOutputPath);
      async function appendPath(path: string) {
        console.log("HEEEEREEEE");
        const binder_inds: IInd[] = await readINDsFromFile(path);
        console.log("INDS: ", binder_inds);
        binder_inds
          .filter(
            (ind) =>
              ind.dependant[0].tableIdentifier == table ||
              ind.referenced[0].tableIdentifier == table
          )
          .forEach((ind) => {
            // ind.dependant.forEach(column => { column.schemaIdentifier = schema; })
            // ind.referenced.forEach(column => { column.schemaIdentifier = schema; })
          });
        inds.concat(binder_inds);
      }
      expectedOutputPath.forEach((path) => appendPath(path));
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

async function readINDsFromFile(path: string): Promise<IInd[]> {
  const result = await readFile(path, "utf8");
  return result
    .trim()
    .split(/\r?\n/)
    .map((json_strings) => JSON.parse(json_strings) as IInd);
}
