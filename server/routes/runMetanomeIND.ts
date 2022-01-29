import { Request, Response, RequestHandler } from "express";
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
  await algorithm.run();
}
