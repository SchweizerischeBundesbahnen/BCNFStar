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
    SQL += this.tableCreation(schema);
    SQL += this.dataTransfer([...schema.tables]);
    SQL += this.primaryKeys([...schema.regularTables]);
    SQL += this.foreignKeys(schema);
    return SQL;
  }

  public abstract schemaPreparation(schema: Schema): string;

  /**
   * @param keepSchema whether the original schema name of the table should be kept.
   *  Only set to true if you want to generate SQL for schema matching
   */
  public tableCreation(
    schema: Schema,
    tables: Iterable<BasicTable> = schema.tables,
    keepSchema = false
  ): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.createTableSql(schema, table, keepSchema) + '\n';
    }
    return Sql;
  }

  /**
   * @returns a CREATE TABLE statement containing all final columns, but no keys for the given `table`
   */
  public createTableSql(
    schema: Schema,
    table: BasicTable,
    keepSchema = false
  ): string {
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
    const tableName = keepSchema
      ? this.escape(table.fullName)
      : this.tableIdentifier(table);
    return `CREATE TABLE ${tableName} (
${columnStrings.join(',\n')});\n`;
  }

  public dataTransfer(tables: Array<BasicTable>): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.dataTransferSql(table) + '\n';
    }
    return Sql;
  }

  public dataTransferSql(table: BasicTable): string {
    let Sql = '';

    let columns: BasicColumn[] = [];
    if (table instanceof UnionedTable) {
      columns = table.displayedColumns();
    } else if (table instanceof Table) {
      columns = table.columns.asArray();
    } else {
      throw Error('Not implemented for tables other than unioned and regular');
    }

    Sql = `INSERT INTO ${this.tableIdentifier(
      table
    )} (${this.generateColumnString(columns)}) `;

    if (table instanceof UnionedTable) {
      Sql += 'SELECT * FROM (';
      Sql += this.selectStatement(
        table.tables[0],
        table.columns[0],
        table.displayedColumns().map((c) => c.dataType)
      );
      Sql += '\n UNION \n';
      Sql += this.selectStatement(
        table.tables[1],
        table.columns[1],
        table.displayedColumns().map((c) => c.dataType)
      );
      Sql += ') as X';
    } else if (table instanceof Table) {
      Sql += this.selectStatement(
        table,
        table.columns.asArray(),
        table.columns.asArray().map((c) => c.dataType)
      );
    } else {
      throw Error('Not implemented for tables other than unioned and regular');
    }

    Sql += ';';
    return Sql;
  }

  public selectStatement(
    table: Table,
    columns: Array<Column | null>,
    dataTypes: string[] = []
  ) {
    let Sql = '';
    Sql += `SELECT DISTINCT ${columns
      .map((col, index) => `${this.columnIdentifier(col, dataTypes[index])}`)
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
      for (const fk of schema.fksOf(referencingTable, true)) {
        if (fk.referencedTable.implementsSurrogateKey()) {
          Sql += this.addSkColumnToReferencingSql(fk);
          Sql += this.updateSurrogateKeySql(fk);
          Sql += this.foreignSurrogateKeySql(fk);
        } else {
          Sql += this.uniqueConstraint(fk);
          Sql += this.foreignKeySql(fk);
        }
      }
    }
    return Sql;
  }

  // TODO: Duplicate column-names possible if one table references two different tables with same sk-name.
  public addSkColumnToReferencingSql(fk: TableRelationship): string {
    return `ALTER TABLE ${this.tableIdentifier(fk.referencingTable)} ADD ${
      fk.referencingName
    } INT;
    ${this.suffix()}
    `;
  }

  /** Updates the FK-Column of the referencing table by joining referencing and referenced table
   * on the multi-column foreign key. Different Syntax for MsSql and Postgres.
   */
  public updateSurrogateKeySql(fk: TableRelationship): string {
    return `
    UPDATE ${this.tableIdentifier(fk.referencingTable)}
    SET ${fk.referencingName} = ${this.tableIdentifier(fk.referencedTable)}.${
      fk.referencedTable.surrogateKey
    }
    FROM ${this.updateSurrogateKeySource(fk)}
    WHERE ${fk.referencingCols
      .map(
        (c: Column, i: number) =>
          `${this.schemaWideColumnIdentifier(
            fk.referencingTable,
            c
          )} = ${this.schemaWideColumnIdentifier(
            fk.referencedTable,
            fk.referencedCols[i]
          )}`
      )
      .join(' AND ')};`;
  }

  public updateSurrogateKeySource(fk: TableRelationship): string {
    return `${this.tableIdentifier(
      fk.referencingTable
    )}, ${this.tableIdentifier(fk.referencedTable)}`;
  }

  public foreignSurrogateKeySql(fk: TableRelationship) {
    return `
    ALTER TABLE ${this.tableIdentifier(fk.referencingTable)}
    ADD CONSTRAINT ${this.randomFkName()}
    FOREIGN KEY (${fk.referencingName})
    REFERENCES ${this.tableIdentifier(fk.referencedTable)} (${
      fk.referencedTable.surrogateKey
    });`;
  }

  /** Creating unique names, that aren't longer than 128 Chars (DBMS-Constraint).
   * Those aren't visible to the user */
  public randomFkName(): string {
    return `fk_${Math.random().toString(16).slice(2)}`;
  }

  /** Relevant if you want to reference columns, which aren't the primary key.
   */
  public uniqueConstraint(fk: TableRelationship): string {
    return `
ALTER TABLE ${this.tableIdentifier(
      fk.referencedTable
    )} ADD UNIQUE (${this.generateColumnString(fk.referencedCols)});
`;
  }

  public foreignKeySql(fk: TableRelationship): string {
    return `ALTER TABLE ${this.tableIdentifier(fk.referencingTable)}
      ADD CONSTRAINT ${this.randomFkName()}
      FOREIGN KEY (${this.generateColumnString(fk.referencingCols)})
      REFERENCES ${this.tableIdentifier(
        fk.referencedTable
      )} (${this.generateColumnString(fk.referencedCols)});`;
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

  public generateColumnString(columns: BasicColumn[]): string {
    return columns.map((c) => this.escape(c.name)).join(', ');
  }

  /** Returns the Identifier of the persisted-table
   * For example: If you want to update the Surrogate-Key columns, you want to reference the already created tables.
   */
  public tableIdentifier(table: BasicTable): string {
    return `${this.escape(this.schemaName)}.${this.escape(table.name)}`;
  }

  public sourceTableIdentifier(table: SourceTable): string {
    return `${this.escape(table.schemaName)}.${this.escape(table.name)}`;
  }

  public columnIdentifier(
    column: Column | null,
    dataType: string = ''
  ): string {
    if (column == null) return ` CAST (null AS ${dataType}) `;
    return `${this.escape(column.sourceTableInstance.alias)}.${this.escape(
      column.sourceColumn.name
    )}`;
  }

  public abstract surrogateKeyString(name: string): string;

  public schemaWideColumnIdentifier(table: Table, column: Column): string {
    return `${this.escape(this.schemaName)}.${this.escape(
      table.name
    )}.${this.escape(column.name)}`;
  }

  public suffix(): string {
    return '';
  }
}
