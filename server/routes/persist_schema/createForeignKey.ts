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

export default function postCreateForeignKey(pool: Pool): RequestHandler {
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

      const client: PoolClient = await pool.connect();

      if (
        !sqlUtils.tableExistsInSchema(referencingSchema, referencingTable) ||
        !sqlUtils.schemaExistsInDatabase(referencingSchema) ||
        !sqlUtils.tableExistsInSchema(referencedSchema, referencedTable) ||
        !sqlUtils.schemaExistsInDatabase(referencedSchema)
      ) {
        res.json("please type in a schema/table that exists");
        res.status(400);
        return;
      }

      await client.query(`
            ALTER TABLE ${referencingSchema}.${referencingTable} 
                ADD CONSTRAINT ${constraintName}
                FOREIGN KEY (${Object.keys(columnMapping)
                  .map((a) => '"' + a + '"')
                  .join(", ")})
                REFERENCES ${referencedSchema}.${referencedTable} (${Object.values(
        columnMapping
      )
        .map((a) => '"' + a + '"')
        .join(", ")});
            `);
      res.json("works");
      res.status(200);
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not create foreign key" });
      res.status(502);
    }
  }
  return createForeignKey;
}
