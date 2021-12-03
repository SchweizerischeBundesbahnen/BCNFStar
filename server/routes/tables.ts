import ITable from "@/definitions/ITable";
import { Request, Response, RequestHandler } from "express";
import { Pool } from "pg";

export default function getTablesFunction(pool: Pool): RequestHandler {
  async function getTables(req: Request, res: Response): Promise<void> {
    try {
      const client = await pool.connect();
      const query_result = await client.query<{
        table_name: string;
        data_type: string;
        column_name: string;
      }>(
        // the last line excludes system tables
        `SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')`,
        []
      );
      const tempTables: Record<string, ITable> = {};
      for (const row of query_result.rows) {
        if (!tempTables[row.table_name]) {
          tempTables[row.table_name] = { name: row.table_name, attribute: [] };
        }
        tempTables[row.table_name].attribute.push({
          name: row.column_name,
          dataType: row.data_type,
        });
      }
      const tables: ITable[] = Object.values(tempTables);

      res.json(tables);
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not get tables" });
      res.status(502);
    }
  }

  return getTables;
}
