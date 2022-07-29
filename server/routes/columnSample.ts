import { Request, Response } from "express";
import { sqlUtils } from "@/db";

export default async function getColumnSample(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parameter = req.query as { tableName: string; columnName: string };
    const query_result = await sqlUtils.getColumnSample(
      parameter.tableName,
      parameter.columnName
    );
    let sample = [];
    query_result.forEach((row) => {
      sample.push(row[parameter.columnName]);
    });
    res.json(sample);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get samples" });
  }
}
