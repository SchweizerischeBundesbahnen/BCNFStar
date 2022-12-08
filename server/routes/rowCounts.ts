import { Request, Response } from "express";
import { sqlUtils } from "@/db";
import IRowCounts from "@/definitions/IRowCounts";

/*export async function getTableRowCounts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const query_result_tables = await sqlUtils.getSchema();
    let rowCounts: Record<string, (IRowCounts | void)> = {};

    for (const row of query_result_tables) {
      const complete_name = `${row.table_schema}.${row.table_name}`;
      if (!rowCounts[complete_name]) {
        rowCounts[complete_name] = await sqlUtils.getTableRowCount(row.table_name, row.table_schema)
          .catch((e) =>
            console.error(
              "Error while getting row count for table: " + complete_name,
              e
            )
          );
      }
    }

    const result: Record<string, IRowCounts> = {};
    for (const tablename in rowCounts) {
      result[tablename] = (rowCounts[tablename]) || {
        entries: 0,
        groups: 0,
      };
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get row counts" });
  }
}*/


export async function getTableRowCounts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const rowCounts = await sqlUtils.getTableRowCounts();

    const result: Record<string, IRowCounts> = {};
    
    for (const row of rowCounts) {
      const complete_name = `${row.table_schema}.${row.table_name}`;
      if (!result[complete_name]) {
        result[complete_name] = {
          entries: row.count,
          groups: row.count
        };
      }
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get row counts" });
  }
}
