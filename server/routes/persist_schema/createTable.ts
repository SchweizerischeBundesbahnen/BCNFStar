import { Request, Response, RequestHandler } from "express";
import { EOL } from "os";
import { Pool, PoolClient } from "pg";
import { sqlUtils } from "../../db";

function jsonEscape(str) {
  return str
    .replace(/\n/g, "\\\\n")
    .replace(/\r/g, "\\\\r")
    .replace(/\t/g, "\\\\t");
}
// async function buildPrepareDatabaseStatement(
//   newSchema: string,
//   newTable: string
// ) {
//   await sqlUtils.query(`CREATE SCHEMA IF NOT EXISTS ${newSchema}`);
//   await client.query(`DROP TABLE IF EXISTS ${newSchema}.${newTable};`);
// }

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

async function buildCreateTableStatement(
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

async function buildAddPrimaryKeyStatement(
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

export default function getCreateTableStatement(): RequestHandler {
  async function createTable(req: Request, res: Response): Promise<void> {
    try {
      const [
        attributeNames,
        primaryKey,
        [newSchema, newTable, originSchema, originTable],
      ] = parseBody(req.body);

      // const attributeNames =  ["BusinessEntityID", "PersonType", "EmailPromotion", "Suffix", "ModifiedDate"];
      // const primaryKey= ["BusinessEntityID"];
      // const [newSchema, newTable, originSchema, originTable]: string[]= ["new", "NewPerson","Person", "Person"];

      if (isInvalidName(newSchema) || isInvalidName(newTable)) {
        res.json("invalid characters in new schema/table name");
        res.status(400);
        return;
      }
      if (
        !(await sqlUtils.tableExistsInSchema(originSchema, originTable)) ||
        !(await sqlUtils.schemaExistsInDatabase(originSchema))
      ) {
        res.json("please type in a schema/table that exists");
        res.status(400);
        return;
      }
      if (
        await sqlUtils.attributesExistInTable(
          attributeNames,
          originSchema,
          originTable
        )
      ) {
        let sqlStatement: string = "";

        sqlStatement = sqlUtils.SQL_CREATE_SCHEMA(newSchema) + EOL;
        sqlStatement +=
          sqlUtils.SQL_DROP_TABLE_IF_EXISTS(newSchema, newTable) + EOL;
        sqlStatement +=
          (await sqlUtils.SQL_CREATE_TABLE(
            attributeNames,
            originSchema,
            originTable,
            newSchema,
            newTable
          )) + EOL;

        sqlStatement +=
          sqlUtils.SQL_INSERT_DATA(
            attributeNames,
            originSchema,
            originTable,
            newSchema,
            newTable
          ) + EOL;
        sqlStatement +=
          sqlUtils.SQL_ADD_PRIMARY_KEY(newSchema, newTable, primaryKey) + EOL;

        res.json({ sql: sqlStatement });
        res.status(200);
      } else {
        res.json("attributes dont exist");
        res.status(400);
      }
    } catch (error) {
      console.error(error);
      res.json({ error: "Could not create tables" });
      res.status(502);
    }
  }
  return createTable;
}
