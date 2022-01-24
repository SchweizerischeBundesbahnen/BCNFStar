import { Request, Response, RequestHandler } from "express";
import { EOL } from "os";
import { sqlUtils } from "../../db";

function parseBody(body: any): string[][] {
  const attributeNames: string[] = body.attribute.map((a) => a.name);
  const primaryKey: string[] = body.primaryKey;
  const newSchema: string = body.newSchema;
  const newTable: string = body.newTable;
  const originSchema: string = body.originSchema;
  const originTable: string = body.originTable;

  return [
    attributeNames,
    primaryKey,
    [newSchema, newTable, originSchema, originTable],
  ];
}

export default function getCreateTableStatement(): RequestHandler {
  async function createTable(req: Request, res: Response): Promise<void> {
    try {
      const [
        attributeNames,
        primaryKey,
        [newSchema, newTable, originSchema, originTable],
      ] = parseBody(req.body);

      if (
        !(await sqlUtils.tableExistsInSchema(originSchema, originTable)) ||
        !(await sqlUtils.schemaExistsInDatabase(originSchema))
      ) {
        res.json("OriginSchema/OriginTable does not exists in database.");
        res.status(400);
        return;
      }
      const sqlStatement: string =
        (await sqlUtils.SQL_CREATE_TABLE(
          attributeNames,
          primaryKey,
          originSchema,
          originTable,
          newSchema,
          newTable
        )) + EOL;

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
