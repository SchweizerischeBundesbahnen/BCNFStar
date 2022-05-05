import { Request, Response, RequestHandler } from "express";
import { EOL } from "os";
import { sqlUtils } from "../../db";
import { IRequestBodyCreateTableSql } from "@/definitions/IBackendAPI";

export default function getCreateTableStatement(): RequestHandler {
  async function createTable(req: Request, res: Response): Promise<void> {
    try {
      const body: IRequestBodyCreateTableSql =
        req.body as IRequestBodyCreateTableSql;

      const sqlStatement: string =
        sqlUtils.SQL_CREATE_TABLE(
          body.attributes,
          body.primaryKey,
          body.newSchema,
          body.newTable
        ) + EOL;
      res.json({ sql: sqlStatement });
      res.status(200);
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not create tables" });
      res.status(502);
    }
  }
  return createTable;
}
