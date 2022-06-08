import TableRelationship from '../TableRelationship';
import Column from '../Column';
import Schema from '../Schema';
import SourceTable from '../SourceTable';
import Table from '../Table';

export default abstract class SQLPersisting {
  public constructor(protected schemaName: string) {}

  public abstract escape(str: string): string;

  public createSQL(schema: Schema): string {
    let SQL = '';
    SQL += this.schemaPreparation(schema);
    SQL += this.tableCreation([...schema.tables]);
    SQL += this.dataTransfer([...schema.tables]);
    SQL += this.primaryKeys([...schema.tables]);
    SQL += this.foreignKeys(schema);
    return SQL;
  }

  public abstract schemaPreparation(schema: Schema): string;

  public tableCreation(tables: Array<Table>): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.createTableSql(table) + '\n';
    }
    return Sql;
  }

  public createTableSql(table: Table): string {
    let columnStrings: string[] = [];

    if (table.implementsSurrogateKey()) {
      columnStrings.push(this.surrogateKeyString(table.surrogateKey));
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

  public dataTransfer(tables: Array<Table>): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.dataTransferSql(table) + '\n';
    }
    return Sql;
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
    Sql += ';';
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

  /** Updates the FK-Column of the referencing table by joining referencing and referenced table
   * on the multi-column foreign key. Different Syntax for MsSql and Postgres.
   */
  public abstract updateSurrogateKeySql(fk: TableRelationship): string;

  public foreignSurrogateKeySql(fk: TableRelationship) {
    return `
    ALTER TABLE ${this.tableIdentifier(fk.referencing)}
    ADD CONSTRAINT ${this.randomFkName()}
    FOREIGN KEY (${this.fkSurrogateKeyName(fk)})
    REFERENCES ${this.tableIdentifier(fk.referenced)} (${
      fk.referenced.surrogateKey
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
      fk.referenced
    )} ADD UNIQUE (${this.generateColumnString(fk.relationship.referenced)});
`;
  }

  public foreignKeySql(fk: TableRelationship): string {
    return `ALTER TABLE ${this.tableIdentifier(fk.referencing)}
      ADD CONSTRAINT ${this.randomFkName()}
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

  /** Returns the Identifier of the persisted-table
   * For example: If you want to update the Surrogate-Key columns, you want to reference the already created tables.
   */
  public tableIdentifier(table: Table): string {
    return `${this.escape(this.schemaName)}.${this.escape(table.name)}`;
  }

  public sourceTableIdentifier(table: SourceTable): string {
    return `${this.escape(table.schemaName)}.${this.escape(table.name)}`;
  }

  public columnIdentifier(column: Column): string {
    return `${this.escape(column.sourceTableInstance.alias)}.${this.escape(
      column.sourceColumn.name
    )}`;
  }

  /** Name of the referencing column for a surrogate key. */
  public fkSurrogateKeyName(fk: TableRelationship): string {
    return (
      fk.referenced.surrogateKey +
      '_' +
      fk.relationship.referencing.map((col) => col.name).join('_')
    );
  }

  public abstract surrogateKeyString(name: string): string;

  public schemaWideColumnIdentifier(table: Table, column: Column): string {
    return `${this.escape(this.schemaName)}.${this.escape(
      table.name
    )}.${this.escape(column.name)}`;
  }

  public abstract suffix(): string;
}
