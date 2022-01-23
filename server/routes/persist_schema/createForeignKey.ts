import { Request, Response, RequestHandler } from "express";
import { Pool, PoolClient } from "pg";
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
      const columnMapping: {} = body.mapping;

      // const referencingSchema: string = "new";
      // const referencingTable: string = "NewPerson";
      // const referencedSchema: string = "Person";
      // const referencedTable: string = "Person";
      // const columnMapping: {} = {BusinessEntityID : "BusinessEntityID"};
      // const constraintName = "ABC";

      if (
        !(await sqlUtils.tableExistsInSchema(
          referencingSchema,
          referencingTable
        )) ||
        !(await sqlUtils.schemaExistsInDatabase(referencingSchema)) ||
        !(await sqlUtils.tableExistsInSchema(
          referencedSchema,
          referencedTable
        )) ||
        !(await sqlUtils.schemaExistsInDatabase(referencedSchema))
      ) {
        res.json("please type in a schema/table that exists");
        res.status(400);
        return;
      }

      const referencingColumns: string[] = Object.keys(columnMapping);
      const referencedColumns: string[] = Object.values(columnMapping);

      console.log("referencingColumns", referencingColumns);
      console.log("referencedColumns", referencedColumns);

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
