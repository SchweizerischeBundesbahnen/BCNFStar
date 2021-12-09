import { PoolClient } from "pg";

export async function schemaExistsInDatabase(
  client: PoolClient,
  schema: string
): Promise<boolean> {
  return client
    .query(
      `
    SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
    `,
      [schema]
    )
    .then((queryResult) => queryResult.rowCount > 0);
}

export async function tableExistsInSchema(
  client: PoolClient,
  schema: string,
  table: string
): Promise<boolean> {
  return client
    .query(
      `
    SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2
    `,
      [schema, table]
    )
    .then((queryResult) => queryResult.rowCount > 0);
}

export async function attributesExistInTable(
  client: PoolClient,
  attributeNames: string[],
  originSchema: string,
  originTable: string
): Promise<boolean> {
  const query_result = await client.query<{
    column_name: string;
  }>(
    `SELECT column_name 
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2;`,
    [originSchema, originTable]
  );
  const originTableColumns = query_result.rows.map((row) => row.column_name);
  return attributeNames.every((name) => originTableColumns.includes(name));
}

export function split(schemaAndTable: string): string[] {
  const schema = schemaAndTable.split(".")[0];
  const table = schemaAndTable.split(".").slice(1).join(".");
  return [schema, table];
}
