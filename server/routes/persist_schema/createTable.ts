import { Request, Response, RequestHandler } from "express";
import { EOL } from "os";
import { sqlUtils } from "../../db";
import IAttribute from "../../definitions/IAttribute";

function parseBody(body: any): string[][] {
  const primaryKey: string[] = body.primaryKey;
  const newSchema: string = body.newSchema;
  const newTable: string = body.newTable;

  return [primaryKey, [newSchema, newTable]];
}

export default function getCreateTableStatement(): RequestHandler {
  async function createTable(req: Request, res: Response): Promise<void> {
    try {
      const [primaryKey, [newSchema, newTable]] = parseBody(req.body);

      const attributes: IAttribute[] = req.body.attributes as IAttribute[];
      const sqlStatement: string =
        sqlUtils.SQL_CREATE_TABLE(attributes, primaryKey, newSchema, newTable) +
        EOL;
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
