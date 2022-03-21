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
