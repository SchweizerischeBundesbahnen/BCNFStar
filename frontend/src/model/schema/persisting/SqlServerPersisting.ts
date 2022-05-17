import Schema from '../Schema';
import SQLPersisting from './SQLPersisting';

export default class SqlServerPersisting extends SQLPersisting {
  public schemaPreparation(schema: Schema): string {
    let Sql: string = '';
    Sql +=
      `
IF NOT EXISTS ( SELECT  *
FROM sys.schemas
WHERE name = N'${schema.name!}' )
EXEC('CREATE SCHEMA [${schema.name!}]');
GO
` + '\n';
    for (const table of schema.tables) {
      Sql +=
        `DROP TABLE IF EXISTS ${this.tableIdentifier(table)};` + '\n GO \n';
    }
    return Sql;
  }

  public escape(str: string) {
    return `[${str}]`;
  }
}
