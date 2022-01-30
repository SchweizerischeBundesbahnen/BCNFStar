import { IRequestBodyForeignKeySql } from "@/definitions/IBackendAPI";
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
      const body: IRequestBodyForeignKeySql =
        req.body as IRequestBodyForeignKeySql;

      const sqlStatement: string = sqlUtils.SQL_FOREIGN_KEY(
        body.name,
        body.relationship.referencing.schemaName, // referencing?!
        body.relationship.referencing.name,
        body.relationship.columnRelationship.map((c) => c.referencingColumn),
        body.relationship.referenced.schemaName, // referencing?!
        body.relationship.referenced.name,
        body.relationship.columnRelationship.map((c) => c.referencedColumn)
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
