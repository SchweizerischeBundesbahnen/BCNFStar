import { Request, Response, RequestHandler } from "express";
import { sqlUtils } from "../../db";

export default function getAddPrimaryKeySQL(): RequestHandler {
  async function createPrimaryKey(req: Request, res: Response): Promise<void> {
    try {
      const schema: string = req.body.schema;
      const table: string = req.body.table;
      const primaryKey: string[] = req.body.primaryKey;
      const sqlStatement = sqlUtils.SQL_ADD_PRIMARY_KEY(
        schema,
        table,
        primaryKey
      );
      res.json({ sql: sqlStatement });
      res.status(200);
    } catch (error) {
      console.error(error);
      res.json({
        error: "Could not create SQL-Statement to add a primary key",
      });
      res.status(502);
    }
  }
  return createPrimaryKey;
}
