import { Request, Response } from "express";
import { sqlUtils } from "@/db";

export default async function getRedundanceSum(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parameter = req.query as { tableSql: string; fdColumns: string };
    const query_result = await sqlUtils.getRedundantValuesByColumns(
      parameter.tableSql,
      JSON.parse(parameter.fdColumns)
    );
    res.json(query_result == null ? 0 : +query_result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get ranking redundances" });
  }
}
