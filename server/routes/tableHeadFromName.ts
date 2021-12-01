import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler } from "express";
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
        attributes: Object.keys(query_result.rows[0]),
        rows: query_result.rows,
      };
      res.json(result);
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not get tables" });
      res.status(502);
    }
  }

  return getTableHeadFromName;
}
