import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler, query } from "express";
import { Pool } from "pg";
import { sqlUtils } from "../db";

export default function getTableHeadFunction(): RequestHandler {
  async function getTableHead(req: Request, res: Response): Promise<void> {
    try {
      const query_result_tables = await sqlUtils.getSchema();
      let temp_table_heads: Record<string, Promise<ITableHead>> = {};

      for (const row of query_result_tables) {
        const complete_name = `${row.table_schema}.${row.table_name}`;
        if (!temp_table_heads[complete_name]) {
          console.log(row.table_name, row.table_schema);
          temp_table_heads[complete_name] = sqlUtils.getTableHead(
            row.table_name,
            row.table_schema
          );
        }
      }
      const values = await Promise.all(Object.values(temp_table_heads));
      const keys = Object.keys(temp_table_heads);
      const result: Record<string, ITableHead> = {};
      for (const index in keys) {
        result[keys[index]] = values[index];
      }
      // console.log(result)
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not get tables" });
    }
  }

  return getTableHead;
}
