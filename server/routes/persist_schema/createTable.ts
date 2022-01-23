import { Request, Response, RequestHandler } from "express";
import { Pool, PoolClient } from "pg";
import { sqlUtils } from "../../db";

async function prepareDatabase(
  client: PoolClient,
  newSchema: string,
  newTable: string
) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${newSchema}`);
  await client.query(`DROP TABLE IF EXISTS ${newSchema}.${newTable};`);
}

// Catches "SQL-Injection"-Requests
function isInvalidName(name: string): boolean {
  return !/^[a-zA-Z\_]+$/.test(name);
}

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

async function executeCreateTable(
  client: PoolClient,
  attributeNames: string[],
  originSchema: string,
  originTable: string,
  newSchema: string,
  newTable: string
): Promise<void> {
  await client.query(`CREATE TABLE ${newSchema}.${newTable} AS SELECT DISTINCT
        ${attributeNames
          .map((a) => '"' + a + '"')
          .join(", ")} FROM ${originSchema}.${originTable};`);
}

async function addPrimaryKey(
  client: PoolClient,
  newSchema: string,
  newTable: string,
  primaryKey: string[]
): Promise<void> {
  await client.query(
    `ALTER TABLE ${newSchema}.${newTable} ADD PRIMARY KEY (${primaryKey
      .map((a) => '"' + a + '"')
      .join(", ")});`
  );
}

export default function postCreateTable(pool: Pool): RequestHandler {
  async function createTable(req: Request, res: Response): Promise<void> {
    try {
      const [
        attributeNames,
        primaryKey,
        [newSchema, newTable, originSchema, originTable],
      ] = parseBody(req.body);

      if (isInvalidName(newSchema) || isInvalidName(newTable)) {
        res.json("invalid characters in new schema/table name");
        res.status(400);
        return;
      }

      const client = await pool.connect();

      if (
        !sqlUtils.tableExistsInSchema(originSchema, originTable) ||
        !sqlUtils.schemaExistsInDatabase(originSchema)
      ) {
        res.json("please type in a schema/table that exists");
        res.status(400);
        return;
      }

      prepareDatabase(client, newSchema, newTable).then(async () => {
        if (
          sqlUtils.attributesExistInTable(
            attributeNames,
            originSchema,
            originTable
          )
        ) {
          executeCreateTable(
            client,
            attributeNames,
            originSchema,
            originTable,
            newSchema,
            newTable
          ).then(async () => {
            await addPrimaryKey(client, newSchema, newTable, primaryKey);
          });
          res.json("successfull");
          res.status(200);
        } else {
          res.json("attributes dont exist");
          res.status(400);
        }
      });
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not create tables" });
      res.status(502);
    }
  }
  return createTable;
}
