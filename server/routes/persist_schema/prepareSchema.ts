import { Request, Response, RequestHandler } from "express";
import { EOL } from "os";
import { sqlUtils } from "../../db";

export default function getSchemaPreparationSQL(): RequestHandler {
  async function schemaPreparationStatement(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const newSchema: string = req.body.schema;
      const tables: string[] = req.body.tables;

      let sqlStatement: string = "";
      sqlStatement = sqlUtils.SQL_CREATE_SCHEMA(newSchema) + EOL;
      sqlStatement += tables
        .map((table) => sqlUtils.SQL_DROP_TABLE_IF_EXISTS(newSchema, table))
        .join(EOL);

      res.json({ sql: sqlStatement });
      res.status(200);
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not create tables" });
      res.status(502);
    }
  }
  return schemaPreparationStatement;
}
