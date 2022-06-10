import TableRelationship from '../TableRelationship';
import Column from '../Column';
import Schema from '../Schema';
import Table from '../Table';
import SQLPersisting from './SQLPersisting';

export default class MsSqlPersisting extends SQLPersisting {
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

  /** In MsSql you don't have to specify the columns, you want to insert into, explicitly.
   * IDENTITY-Columns are filled automatically. */
  public override dataTransferSql(table: Table): string {
    let Sql = '';

    Sql = `INSERT INTO ${this.tableIdentifier(
      table
    )} SELECT DISTINCT ${table.columns
      .asArray()
      .map((col) => `${this.columnIdentifier(col)}`)
      .join(', ')} FROM ${table.sources
      .map((source) => {
        let sourceString = this.sourceTableIdentifier(source.table);
        if (source.userAlias) sourceString += ' AS ' + source.alias;
        return sourceString;
      })
      .join(', ')}`;
    if (table.sources.length > 1)
      Sql += ` WHERE ${table.relationships
        .map((r) =>
          r.referencing
            .map(
              (c, i) =>
                `${this.columnIdentifier(c)} = ${this.columnIdentifier(
                  r.referenced[i]
                )}`
            )
            .join(' AND ')
        )
        .join(' AND ')}`;
    Sql += ';';
    return Sql;
  }

  public override updateSurrogateKeySql(fk: TableRelationship): string {
    return `
    UPDATE  ${this.tableIdentifier(fk.referencing)}
    SET ${fk.referencingName} = ${this.tableIdentifier(fk.referenced)}.${
      fk.referenced.surrogateKey
    }
    FROM  ${this.tableIdentifier(fk.referencing)}, ${this.tableIdentifier(
      fk.referenced
    )}
    WHERE ${fk.relationship.referencing
      .map(
        (c: Column, i: number) =>
          `${this.schemaWideColumnIdentifier(
            fk.referencing,
            c
          )} = ${this.schemaWideColumnIdentifier(
            fk.referenced,
            fk.relationship.referenced[i]
          )}`
      )
      .join(' AND ')};`;
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
