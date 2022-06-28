import { Request, Response } from "express";
import { sqlUtils } from "@/db";

export default async function getRankingRedundanceSum(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parameter = req.query as { tableName: string; fdColumns: string };
    const query_result = await sqlUtils.getRedundantValuesByColumns(
      parameter.tableName,
      JSON.parse(parameter.fdColumns)
    );
    res.json(
      query_result.map((row: any) => +row.sum)[0] == null
        ? 0
        : query_result.map((row: any) => +row.sum)[0]
    );
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get ranking redundances" });
  }
}
