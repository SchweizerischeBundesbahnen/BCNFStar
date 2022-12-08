import Schema from '../Schema';
import SQLPersisting from './SQLPersisting';

export default class SynapseSqlPersisting extends SQLPersisting {
  public schemaPreparation(schema: Schema): string {
    let Sql: string = '';
    Sql +=
      `
IF NOT EXISTS ( SELECT  *
FROM sys.schemas
WHERE name = N'${this.schemaName!}' )
EXEC('CREATE SCHEMA [${this.schemaName!}]');
GO
` + '\n';
    for (const table of schema.tables) {
      Sql +=
        `DROP TABLE IF EXISTS ${this.tableIdentifier(table)};` + '\n GO \n';
    }
    return Sql;
  }

  public override surrogateKeyString(name: string): string {
    return `${this.escape(name)} INT IDENTITY(1,1)`;
  }

  /** Necessary if you use schema-editing commands and queries that require those in one batch.
   * e.g.: Adding a column to a table and selecting this column in a following query  */
  public override suffix(): string {
    return '\n GO \n';
  }

  public escape(str: string) {
    return `[${str}]`;
  }
}
