import { Request, Response, RequestHandler } from "express";
import { sqlUtils } from "../../db";

export default function getDataTransferSQL(): RequestHandler {
  async function dataTransferSQL(req: Request, res: Response): Promise<void> {
    try {
      const attributeNames: string[] = req.body.attribute.map((a) => a.name);
      const newSchema: string = req.body.newSchema;
      const newTable: string = req.body.newTable;
      const originSchema: string = req.body.originSchema;
      const originTable: string = req.body.originTable;

      const sqlStatement: string = sqlUtils.SQL_INSERT_DATA(
        attributeNames,
        originSchema,
        originTable,
        newSchema,
        newTable
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
