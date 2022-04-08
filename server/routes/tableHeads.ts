import ITablePage from "@/definitions/ITablePage";
import { Request, Response } from "express";
import { sqlUtils } from "../db";

export async function getTableHead(req: Request, res: Response): Promise<void> {
  try {
    if (!req.query.limit) {
      res.status(400).json({ error: "Must specify limit" });
      return;
    }

    const limit: number = +req.query.limit;
    const query_result_tables = await sqlUtils.getSchema();
    let tableHeads: Record<string, Promise<ITablePage | void>> = {};

    for (const row of query_result_tables) {
      const complete_name = `${row.table_schema}.${row.table_name}`;
      if (!tableHeads[complete_name]) {
        tableHeads[complete_name] = sqlUtils
          .getTablePage(row.table_name, row.table_schema, 0, limit)
          .catch((e) =>
            console.log("Error while fetching table head for " + complete_name)
          );
      }
    }
    const result: Record<string, ITablePage> = {};

    for (const tablename in tableHeads) {
      result[tablename] = (await tableHeads[tablename]) || {
        attributes: [],
        rows: [],
      };
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get tables" });
  }
}
