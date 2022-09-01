import getSchemaMatching from "@/coma/schemaMatching";
import ISchemaMatchingRequest from "@/definitions/ISchemaMatchingRequest";
import { Request, Response } from "express";

export default async function getSchemaMatchingRoute(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const request: ISchemaMatchingRequest = req.body;
    res.json(
      await getSchemaMatching(
        request.srcSql,
        request.targetSql,
        request.thesaurus
      )
    );
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get schema matching" });
  }
}
