import Column from '../Column';
import Schema from '../Schema';
import SourceTable from '../SourceTable';
import Table from '../Table';
import SQLPersisting from './SQLPersisting';

export default class PoststgresSQLPersisting extends SQLPersisting {
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
    )} SELECT DISTINCT ${table.columns
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
  //     ADD CONSTRAINT ${constraintName}
  //     FOREIGN KEY (${this.generateColumnString(referencingColumns)})
  //     REFERENCES ${referencedSchema}.${referencedTable} (${this.generateColumnString(
  //       referencedColumns
  //     )});
  // `;
  //   }
}
