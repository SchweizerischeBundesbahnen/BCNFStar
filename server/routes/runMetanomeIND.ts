import { Request, Response } from "express";
import MetanomeINDAlgorithm from "../metanome/metanomeINDAlgorithm";

export default async function runMetanomeIND(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tables: string[] = req.body.tables;
    await runMetanomeINDAlgorithm(tables);
    res.status(200).json({ message: "success!" });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not run algorithm" });
  }
}

export async function runMetanomeINDAlgorithm(tables: string[]): Promise<void> {
  const algorithm = new MetanomeINDAlgorithm(tables);
  await algorithm.run();
}
