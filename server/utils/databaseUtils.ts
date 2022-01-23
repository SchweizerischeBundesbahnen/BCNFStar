export function split(schemaAndTable: string): string[] {
  const schema = schemaAndTable.split(".")[0];
  const table = schemaAndTable.split(".").slice(1).join(".");
  return [schema, table];
}
