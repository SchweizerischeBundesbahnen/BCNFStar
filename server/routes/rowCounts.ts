import { Request, Response } from "express";
import { sqlUtils } from "@/db";

export async function getTableRowCounts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const query_result_tables = await sqlUtils.getSchema();
    let rowCounts: Record<string, Promise<number | void>> = {};

    for (const row of query_result_tables) {
      const complete_name = `${row.table_schema}.${row.table_name}`;
      if (!rowCounts[complete_name]) {
        rowCounts[complete_name] = sqlUtils
          .getTableRowCount(row.table_name, row.table_schema)
          .catch((e) =>
            console.error(
              "Error while getting row count for table: " + complete_name
            )
          );
      }
    }

    const result: Record<string, number> = {};
    for (const tablename in rowCounts) {
      result[tablename] = (await rowCounts[tablename]) || 0;
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get row counts" });
  }
}
