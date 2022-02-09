import ITable from "@/definitions/ITable";
import { Request, Response } from "express";
import { sqlUtils } from "../db";
export default async function getTables(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const query_result = await sqlUtils.getSchema();

    const tempTables: Record<string, ITable> = {};
    for (const row of query_result) {
      const nameWithSchema = `${row.table_schema}.${row.table_name}`;
      if (!tempTables[nameWithSchema]) {
        tempTables[nameWithSchema] = { name: nameWithSchema, attribute: [] };
      }
      tempTables[nameWithSchema].attribute.push({
        name: row.column_name,
        dataType: row.data_type,
      });
    }
    const tables: ITable[] = Object.values(tempTables);

    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get tables" });
  }
}
