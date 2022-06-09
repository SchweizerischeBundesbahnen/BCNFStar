import TableRelationship from '../TableRelationship';
import Column from '../Column';
import Schema from '../Schema';
import SourceTable from '../SourceTable';
import Table from '../Table';
import BasicTable from '../BasicTable';
import UnionedTable from '../UnionedTable';
import BasicColumn from '../../types/BasicColumn';

export default abstract class SQLPersisting {
  public constructor(protected schemaName: string) {}

  public abstract escape(str: string): string;

  public createSQL(schema: Schema): string {
    let SQL = '';
    SQL += this.schemaPreparation(schema);
    SQL += this.tableCreation([...schema.tables]);
    SQL += this.dataTransfer([...schema.tables]);
    SQL += this.primaryKeys([...schema.regularTables]);
    SQL += this.foreignKeys(schema);
    return SQL;
  }

  public abstract schemaPreparation(schema: Schema): string;

  public tableCreation(tables: Array<BasicTable>): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.createTableSql(table) + '\n';
    }
    return Sql;
  }

  public createTableSql(table: BasicTable): string {
    let columnStrings: string[] = [];

    let columns: Array<BasicColumn> = [];

    if (table instanceof Table) {
      if (table.implementsSurrogateKey()) {
        columnStrings.push(this.surrogateKeyString(table.surrogateKey));
      }
      columns = Array.from(table.columns);
    } else if (table instanceof UnionedTable) {
      columns = table.displayedColumns();
    }

    for (const column of columns) {
      let columnString: string = `${column.name} ${column.dataType} `;
      if (!column.nullable) {
        columnString += 'NOT ';
      }
      columnString += 'NULL';
      columnStrings.push(columnString);
    }

    return `CREATE TABLE ${this.tableIdentifier(table)} (${columnStrings.join(
      ', '
    )});`;
  }

  public dataTransfer(tables: Array<Table | UnionedTable>): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.dataTransferSql(table) + '\n';
    }
    return Sql;
  }

  public dataTransferSql(table: Table | UnionedTable): string {
    let Sql = '';

    let columns: Column[] = [];
    if (table instanceof UnionedTable) {
      columns = table.displayedColumns();
    } else {
      columns = table.columns.asArray();
    }

    Sql = `INSERT INTO ${this.tableIdentifier(
      table
    )} (${this.generateColumnString(columns)}) `;

    if (table instanceof UnionedTable) {
      Sql += 'SELECT * FROM (';
      Sql += this.selectStatement(table.tables[0], table.columns[0]);
      Sql += '\n UNION \n';
      Sql += this.selectStatement(table.tables[1], table.columns[1]);
      Sql += ') as X';
    } else {
      Sql += this.selectStatement(table, table.columns.asArray());
    }

    Sql += ';';
    return Sql;
  }

  public selectStatement(table: Table, columns: Array<Column | null>) {
    let Sql = '';
    Sql += `SELECT DISTINCT ${columns
      .map((col) => `${this.columnIdentifier(col)}`)
      .join(', ')} FROM ${table.sources
      .map((source) => {
        let sourceString = this.sourceTableIdentifier(source.table);
        if (source.alias != source.defaultName)
          sourceString += ' AS ' + source.alias;
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
    return Sql;
  }

  public foreignKeys(schema: Schema): string {
    let Sql: string = '';

    for (const referencingTable of schema.tables) {
      for (const fk of schema.fksOf(referencingTable)) {
        if (fk.referenced.implementsSurrogateKey()) {
          Sql += this.addSkColumnToReferencingSql(fk);
          Sql += this.updateSurrogateKeySql(fk);
          Sql += this.foreignSurrogateKeySql(fk);
        } else {
          Sql += this.uniqueConstraint(fk);
          Sql += this.foreignKeySql(fk);
        }
      }
    }
    console.log(Sql);
    return Sql;
  }

  // TODO: Duplicate column-names possible if one table references two different tables with same sk-name.
  public addSkColumnToReferencingSql(fk: TableRelationship): string {
    return `ALTER TABLE ${this.tableIdentifier(
      fk.referencing
    )} ADD ${this.fkSurrogateKeyName(fk)} INT;
    ${this.suffix()}
    `;
  }

  public abstract updateSurrogateKeySql(fk: TableRelationship): string;

  public foreignSurrogateKeySql(fk: TableRelationship) {
    return `
    ALTER TABLE ${this.tableIdentifier(fk.referencing)}
    ADD CONSTRAINT fk_${Math.random().toString(16).slice(2)}
    FOREIGN KEY (${this.fkSurrogateKeyName(fk)})
    REFERENCES ${this.tableIdentifier(fk.referenced)} (${
      fk.referenced.surrogateKey
    });`;
  }

  public uniqueConstraint(fk: TableRelationship): string {
    return `
ALTER TABLE ${this.tableIdentifier(
      fk.referenced
    )} ADD UNIQUE (${this.generateColumnString(fk.relationship.referenced)});
`;
  }

  public foreignKeySql(fk: TableRelationship): string {
    return `ALTER TABLE ${this.tableIdentifier(fk.referencing)}
      ADD CONSTRAINT fk_${Math.random().toString(16).slice(2)}
      FOREIGN KEY (${this.generateColumnString(fk.relationship.referencing)})
      REFERENCES ${this.tableIdentifier(
        fk.referenced
      )} (${this.generateColumnString(fk.relationship.referenced)});`;
  }

  public primaryKeys(tables: Table[]): string {
    let Sql: string = '';
    for (const table of tables) {
      if (table.pk) {
        Sql +=
          `ALTER TABLE ${this.tableIdentifier(table)} ADD PRIMARY KEY (${
            table.implementsSurrogateKey()
              ? table.surrogateKey
              : this.generateColumnString(table.pk.asArray())
          });` + '\n';
      }
    }
    return Sql;
  }

  public generateColumnString(columns: Column[]): string {
    return columns.map((c) => this.escape(c.name)).join(', ');
  }

  public tableIdentifier(table: BasicTable): string {
    return `${this.escape(this.schemaName)}.${this.escape(table.name)}`;
  }

  public sourceTableIdentifier(table: SourceTable): string {
    return `${this.escape(table.schemaName)}.${this.escape(table.name)}`;
  }

  public columnIdentifier(column: Column | null): string {
    if (column == null) return ' null ';
    return `${this.escape(column.sourceTableInstance.alias)}.${this.escape(
      column.sourceColumn.name
    )}`;
  }

  public fkSurrogateKeyName(fk: TableRelationship): string {
    return (
      fk.referenced.surrogateKey +
      '_' +
      fk.relationship.referencing.map((col) => col.name).join('_')
    );
  }

  public abstract surrogateKeyString(name: string): string;

  public schemaWideColumnIdentifier(table: Table, column: Column): string {
    return `${this.escape(table.schemaName)}.${this.escape(
      table.name
    )}.${this.escape(column.name)}`;
  }

  public abstract suffix(): string;
}
