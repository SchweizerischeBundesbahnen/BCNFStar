import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler, query } from "express";
import { Pool } from "pg";

export default function getTableHeadFromNameFunction(
  pool: Pool
): RequestHandler {
  async function getTableHeadFromName(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const client = await pool.connect();
      const query_result = await client.query(
        `SELECT * FROM ${req.params.name.replace("`", "``")} LIMIT 10`
      );
      const result: ITableHead = {
        attributes: query_result.fields.map((v) => v.name),
        rows: query_result.rows,
      };
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Could not get tables" });
    }
  }

  return getTableHeadFromName;
}
