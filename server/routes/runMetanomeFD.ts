import { Request, Response } from "express";
import MetanomeFDAlgorithm from "../metanome/metanomeFDAlgorithm";

export default async function runMetanomeFD(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaAndTable = req.params.name;
    await new MetanomeFDAlgorithm([schemaAndTable]).run();
    res.status(200).json({ message: "success!" });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not run algorithm" });
  }
}
