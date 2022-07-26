import { Request, Response } from "express";
import { sqlUtils } from "@/db";

export default async function getMaxValue(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parameter = req.query as { tableName: string; columnName: string };
    const query_result = await sqlUtils.getMaxValueByColumn(
      parameter.tableName,
      parameter.columnName
    );
    res.json(+query_result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get ranking redundances" });
  }
}
