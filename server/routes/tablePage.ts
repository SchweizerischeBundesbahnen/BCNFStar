import ITablePage from "@/definitions/ITablePage";
import { Request, Response } from "express";
import { sqlUtils } from "../db";

export async function getTablePage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.query.limit) {
      res.status(400).json({ error: "Must specify limit" });
      return;
    }

    const schema = req.query.schema;
    const tablename = req.query.table;
    const limit: number = +req.query.limit;
    const offset: number = +req.query.offset;

    const query_result_tables = await sqlUtils.getSchema();

    if (
      !query_result_tables
        .map((r) => `${r.table_schema}.${r.table_name}`.toLowerCase())
        .includes(`${schema}.${tablename}`.toLowerCase())
    ) {
      console.log(`${schema}.${tablename}`.toLowerCase());
      res.status(404).json({ error: "Table does not exist" });
      return;
    }

    const result: ITablePage = await sqlUtils.getTablePage(
      tablename.toString(),
      schema.toString(),
      offset,
      limit
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get table page" });
  }
}
