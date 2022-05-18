import Column from '../Column';
import Schema from '../Schema';
import Table from '../Table';
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

  public override surrogateKeyString(name: string): string {
    return `${name} INT IDENTITY(1,1)`;
  }

  public override schemaWideColumnIdentifier(
    table: Table,
    column: Column
  ): string {
    return `[${table.schemaName}].[${table.name}].[${column.sourceColumn.name}]`;
  }

  public override suffix(): string {
    return '\n GO \n';
  }

  public escape(str: string) {
    return `[${str}]`;
  }
}
