import { sqlUtils } from "../db";
import IFk from "@/definitions/IFk";
import { Request, Response } from "express";

export default async function getFks(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const query_result = await sqlUtils.getForeignKeys();

    let fks: Array<IFk> = [];
    for (const row of query_result) {
      fks.push({
        name: `${row.table_schema}.${row.table_name}`,
        column: row.column_name,
        foreignName: `${row.foreign_table_schema}.${row.foreign_table_name}`,
        foreignColumn: row.foreign_column_name,
      });
    }

    res.json(fks);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get fks" });
  }
}
