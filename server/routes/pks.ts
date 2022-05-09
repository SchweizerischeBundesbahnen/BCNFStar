import { sqlUtils } from "@/db";
import IPrimaryKey from "@/definitions/IPrimaryKey";
import { Request, Response } from "express";

export default async function getFks(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const query_result = await sqlUtils.getPrimaryKeys();
    const pks: Record<string, IPrimaryKey> = {};
    for (const row of query_result) {
      const nameWithSchema = `${row.table_schema}.${row.table_name}`;
      if (!pks[nameWithSchema]) {
        pks[nameWithSchema] = {
          table_schema: row.table_schema,
          table_name: row.table_name,
          attributes: [],
        };
      }
      pks[nameWithSchema].attributes.push(row.column_name);
    }

    res.json(Object.values(pks));
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get fks" });
  }
}
