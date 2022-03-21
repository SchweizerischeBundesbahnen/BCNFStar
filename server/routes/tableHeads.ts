import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler } from "express";
import { sqlUtils } from "../db";

export default function getTableHeadFunction(): RequestHandler {
  async function getTableHead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.query.limit) {
        res.status(400).json({ error: "Must specify limit" });
        return;
      }
      const limit = +req.query.limit;
      const query_result_tables = await sqlUtils.getSchema();
      let temp_table_heads: Record<string, Promise<ITableHead>> = {};

      for (const row of query_result_tables) {
        const complete_name = `${row.table_schema}.${row.table_name}`;
        if (!temp_table_heads[complete_name]) {
          temp_table_heads[complete_name] = sqlUtils.getTableHead(
            row.table_name,
            row.table_schema,
            limit
          );
        }
      }
      const values = await Promise.all(Object.values(temp_table_heads));
      const keys = Object.keys(temp_table_heads);
      const result: Record<string, ITableHead> = {};
      for (const index in keys) {
        result[keys[index]] = values[index];
      }
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not get tables" });
    }
  }

  return getTableHead;
}
