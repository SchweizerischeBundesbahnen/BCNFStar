import getSchemaMatching from "@/coma/schemaMatching";
import { Request, Response } from "express";

interface ISchemaMatching {
  src: string[];
  target: string[];
}

export default async function getSchemaMatchingRoute(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const request: ISchemaMatching = req.body;
    res.json(await getSchemaMatching(request.src, request.target));
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get schema matching" });
  }
}
