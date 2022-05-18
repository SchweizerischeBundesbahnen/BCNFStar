import { TableRelationship } from '../../types/TableRelationship';
import Column from '../Column';
import Schema from '../Schema';
import SourceTable from '../SourceTable';
import Table from '../Table';

export default abstract class SQLPersisting {
  public constructor() {}

  public createSQL(schema: Schema): string {
    let SQL = '';
    SQL += this.schemaPreparation(schema);
    SQL += this.tableCreation([...schema.tables]);
    SQL += this.dataTransfer([...schema.tables]);
    SQL += this.primaryKeys([...schema.tables]);
    SQL += this.foreignKeys(schema);
    return SQL;
  }

  public tableCreation(tables: Array<Table>): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.createTableSql(table) + '\n';
    }
    return Sql;
  }

  public dataTransfer(tables: Array<Table>): string {
    let Sql: string = '';
    for (const table of tables) {
      Sql += this.dataTransferSql(table) + '\n';
    }
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
    return `ALTER TABLE  ${this.tableIdentifier(fk.referencing)}  ADD FK_${
      fk.referenced.surrogateKey
    } INT;
    ${this.suffix()}
    `;
  }

  public abstract updateSurrogateKeySql(fk: TableRelationship): string;

  public foreignSurrogateKeySql(fk: TableRelationship) {
    return `
    ALTER TABLE ${this.tableIdentifier(fk.referencing)} 
    ADD CONSTRAINT fk_${Math.random().toString(16).slice(2)}
    FOREIGN KEY (FK_${fk.referenced.surrogateKey})
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

  public abstract generateColumnString(columns: Column[]): string;
  public abstract schemaPreparation(schema: Schema): string;
  public abstract createTableSql(table: Table): string;
  public abstract dataTransferSql(table: Table): string;
  public abstract tableIdentifier(table: Table): string;
  public abstract sourceTableIdentifier(table: SourceTable): string;
  public abstract schemaWideColumnIdentifier(
    table: Table,
    column: Column
  ): string;
  public abstract columnIdentifier(column: Column): string;
  public abstract suffix(): string;
}
