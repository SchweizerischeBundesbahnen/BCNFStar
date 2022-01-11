import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler, query } from "express";
import { Pool } from "pg";

export default function getTableHeadFunction(pool: Pool): RequestHandler {
  async function getTableHead(req: Request, res: Response): Promise<void> {
    try {
      const client = await pool.connect();
      const query_result_tables = await client.query(
        `SELECT DISTINCT table_name, table_schema 
          FROM information_schema.columns 
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema')`
      );
      const table_names: Array<string> = [];
      const query_result: Map<string, ITableHead> = new Map();
      let temp_table_name: string;
      let temp_table_head;
      // Promise.All
      // result = await Promise.race(list);
      for (const row of query_result_tables.rows) {
        temp_table_name = `${row.table_schema}.${row.table_name}`;
        temp_table_head = await client.query(
          `SELECT * FROM ${temp_table_name} LIMIT 10`
        );
        query_result[temp_table_name] = {
          attributes: temp_table_head.fields.map((v) => v.name),
          rows: temp_table_head.rows,
        };
      }
      res.json(query_result);
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not get tables" });
    }
  }

  return getTableHead;
}
