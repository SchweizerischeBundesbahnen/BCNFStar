import { Request, Response, RequestHandler } from "express";
import { sqlUtils } from "../db";

export default function getTableRowCountsFunction(): RequestHandler {
  async function getTableRowCounts(req: Request, res: Response): Promise<void> {
    try {
      const query_result_tables = await sqlUtils.getSchema();
      let temp_table_rowCounts: Record<string, Promise<number>> = {};

      for (const row of query_result_tables) {
        const complete_name = `${row.table_schema}.${row.table_name}`;
        if (!temp_table_rowCounts[complete_name]) {
          temp_table_rowCounts[complete_name] = sqlUtils.getTableRowCount(
            row.table_name,
            row.table_schema
          );
        }
      }

      const values = await Promise.all(Object.values(temp_table_rowCounts));
      const keys = Object.keys(temp_table_rowCounts);
      const result: Record<string, number> = {};
      for (const index in keys) {
        result[keys[index]] = values[index];
      }
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not get row counts" });
    }
  }

  return getTableRowCounts;
}
