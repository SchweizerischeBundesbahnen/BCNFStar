import { TableRelationship } from '../../types/TableRelationship';
import Column from '../Column';
import Schema from '../Schema';
import SourceTable from '../SourceTable';
import Table from '../Table';
import SQLPersisting from './SQLPersisting';

export default class PostgreSQLPersisting extends SQLPersisting {
  public schemaPreparation(schema: Schema): string {
    let Sql: string = '';
    Sql += `CREATE SCHEMA IF NOT EXISTS "${schema.name!}";` + '\n';
    for (const table of schema.tables) {
      Sql +=
        `DROP TABLE IF EXISTS ${this.tableIdentifier(table)} CASCADE;` + '\n';
    }
    return Sql;
  }

  public createTableSql(table: Table): string {
    let columnStrings: string[] = [];

    if (table.implementsSurrogateKey()) {
      columnStrings.push(
        `${table.surrogateKey} INT GENERATED ALWAYS AS IDENTITY`
      );
    }

    for (const column of table.columns) {
      let columnString: string = `${column.name} ${column.dataType} `;
      if (table.pk?.includes(column) || !column.nullable) {
        columnString += 'NOT ';
      }
      columnString += 'NULL';
      columnStrings.push(columnString);
    }

    return `CREATE TABLE ${this.tableIdentifier(table)} (${columnStrings.join(
      ', '
    )});`;
  }

  public dataTransferSql(table: Table): string {
    let Sql = '';

    Sql = `INSERT INTO ${this.tableIdentifier(
      table
    )} (${this.generateColumnString(
      table.columns.asArray()
    )}) SELECT DISTINCT ${table.columns
      .asArray()
      .map((col) => `${this.columnIdentifier(col)}`)
      .join(', ')} FROM ${table.sources
      .map((source) => {
        let sourceString = this.sourceTableIdentifier(source.table);
        if (source.useAlias) sourceString += ' AS ' + source.alias;
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

  // https://stackoverflow.com/questions/47925251/postgresql-update-row-based-on-the-same-table#:~:text=In%20Postgres%20SQL%2C%20you%20should%20not%20repeat%20the%20name%20of%20the%20target%20table%20in%20the%20FROM%20clause%20(so%20you%20cannot%20use%20a%20JOIN)
  public override updateSurrogateKeySql(fk: TableRelationship): string {
    return `
    UPDATE  ${this.tableIdentifier(fk.referencing)}  
    SET FK_${fk.referenced.surrogateKey} = ${this.tableIdentifier(
      fk.referenced
    )}.${fk.referenced.surrogateKey} 
    FROM  ${this.tableIdentifier(fk.referenced)}
    WHERE ${fk.relationship.referencing
      .map(
        (c, i) =>
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

  public generateColumnString(columns: Column[]): string {
    return columns.map((c) => `"${c.name}"`).join(', ');
  }

  public tableIdentifier(table: Table): string {
    return `"${table.schemaName}"."${table.name}"`;
  }

  public sourceTableIdentifier(table: SourceTable): string {
    return `"${table.schemaName}"."${table.name}"`;
  }

  public columnIdentifier(column: Column): string {
    return `"${column.sourceTableInstance.identifier}"."${column.sourceColumn.name}"`;
  }

  public override schemaWideColumnIdentifier(
    table: Table,
    column: Column
  ): string {
    return `"${table.schemaName}"."${table.name}"."${column.sourceColumn.name}"`;
  }
  public override suffix(): string {
    return '';
  }
}
