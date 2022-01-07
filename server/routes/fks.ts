import IFk from "@/definitions/IFk";
import { Request, Response, RequestHandler } from "express";
import { Pool } from "pg";

export default function getFksFunction(pool: Pool): RequestHandler {
  async function getFks(req: Request, res: Response): Promise<void> {
    try {
      const client = await pool.connect();
      const query_result = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        foreign_table_schema: string;
        foreign_table_name: string;
        foreign_column_name: string;
      }>(
        // the last line excludes system tables
        `SELECT
            tc.table_schema,
            tc.table_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema NOT IN ('pg_catalog', 'information_schema');`,
        []
      );
      let fks: Array<IFk> = [];
      for (const row of query_result.rows) {
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

  return getFks;
}
