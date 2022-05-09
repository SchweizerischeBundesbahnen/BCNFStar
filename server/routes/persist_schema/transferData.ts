import { Request, Response, RequestHandler } from "express";
import { sqlUtils } from "@/db";
import { IRequestBodyDataTransferSql } from "@/definitions/IBackendAPI";

export default function getDataTransferSQL(): RequestHandler {
  async function dataTransferSQL(req: Request, res: Response): Promise<void> {
    try {
      const body: IRequestBodyDataTransferSql =
        req.body as IRequestBodyDataTransferSql;
      const sqlStatement: string = sqlUtils.SQL_INSERT_DATA(
        body.attributes,
        body.sourceTables,
        body.relationships,
        body.newSchema,
        body.newTable
      );

      res.json({ sql: sqlStatement });
      res.status(200);
    } catch (error) {
      console.error(error);
      res.json({
        error:
          "Could not create SQL-Script to transfer the data from origin to new table",
      });
      res.status(502);
    }
  }
  return dataTransferSQL;
}
