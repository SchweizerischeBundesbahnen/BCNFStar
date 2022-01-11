import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler, query } from "express";
import { Pool } from "pg";
import { sqlUtils } from "../db";

export default function getTableHeadFunction(): RequestHandler {
  async function getTableHead(req: Request, res: Response): Promise<void> {
    try {
      const query_result_tables = await sqlUtils.getSchema();
      const query_result: Map<string, ITableHead> = new Map();
      let temp_table_head;

      for (const row of query_result_tables) {
        if (!query_result[`${row.table_schema}.${row.table_name}`]) {
          temp_table_head = await sqlUtils.getTableHead(
            row.table_name,
            row.table_schema
          );
          query_result[`${row.table_schema}.${row.table_name}`] = {
            attributes: temp_table_head.fields.map((v) => v.name),
            rows: temp_table_head.rows,
          };
        }
      }
      res.json(query_result);
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not get tables" });
    }
  }

  return getTableHead;
}
