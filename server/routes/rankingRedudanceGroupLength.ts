import { Request, Response } from "express";
import { sqlUtils } from "@/db";

export default async function getRankingRedudanceGroupLength(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parameter = req.query as { tableName: string; fdColumns: string };
    const query_result = await sqlUtils.getRedundantGroupLengthByColumns(
      parameter.tableName,
      JSON.parse(parameter.fdColumns)
    );
    res.json(query_result.map((row: any) => +row.count)[0]);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get ranking redundances" });
  }
}
