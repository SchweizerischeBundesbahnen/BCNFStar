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

/**
 * Splits string after first point to separate schema and table name
 * @param schemaAndTable string in format schemaname.tablename
 * @returns [schemaname, tablename]
 */
export function splitTableString(schemaAndTable: string): string[] {
  const firstPointPos = schemaAndTable.indexOf(".");
  const schema = schemaAndTable.substring(0, firstPointPos);
  const table = schemaAndTable.substring(firstPointPos + 1);
  return [schema, table];
}
