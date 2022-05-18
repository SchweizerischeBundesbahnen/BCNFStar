import { sqlUtils } from "@/db";
import IForeignKey from "@/definitions/IForeignKey";
import { Request, Response } from "express";

export default async function getFks(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const query_result = await sqlUtils.getForeignKeys();
    const fkLookup = new Map<string, IForeignKey>();
    for (const row of query_result) {
      if (!fkLookup.has(row.fk_name)) {
        fkLookup.set(row.fk_name, {
          referencing: [],
          referenced: [],
        });
      }
      const fk = fkLookup.get(row.fk_name);
      fk.referencing.push({
        schemaIdentifier: row.table_schema,
        tableIdentifier: row.table_name,
        columnIdentifier: row.column_name,
      });
      fk.referenced.push({
        schemaIdentifier: row.foreign_table_schema,
        tableIdentifier: row.foreign_table_name,
        columnIdentifier: row.foreign_column_name,
      });
    }
    res.json([...fkLookup.values()]);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get fks" });
  }
}
