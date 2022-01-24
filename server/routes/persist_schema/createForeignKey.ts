import { Request, Response, RequestHandler } from "express";
import { sqlUtils } from "../../db";

function parseBody(body: any): string[] {
  return [
    body.referencingSchema,
    body.referencingTable,
    body.referencedSchema,
    body.referencedTable,
    body.constraintName,
  ];
}

interface IDict {
  value: string;
  key: string;
}

export default function getCreateForeignKey(): RequestHandler {
  async function createForeignKey(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      const [
        referencingSchema,
        referencingTable,
        referencedSchema,
        referencedTable,
        constraintName,
      ]: string[] = parseBody(body);
      const columnMapping: IDict[] = body.mapping;
      const referencingColumns: string[] = columnMapping.map(
        (elem) => elem.key
      );
      const referencedColumns: string[] = columnMapping.map((elem) => elem.key);

      const sqlStatement: string = sqlUtils.SQL_FOREIGN_KEY(
        constraintName,
        referencingSchema,
        referencingTable,
        referencingColumns,
        referencedSchema,
        referencedTable,
        referencedColumns
      );

      res.json({ sql: sqlStatement });
      res.status(200);
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not create foreign key" });
      res.status(502);
    }
  }
  return createForeignKey;
}
