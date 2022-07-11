import Schema from '../Schema';
import SQLPersisting from './SQLPersisting';
import TableRelationship from '../TableRelationship';

export default class PostgreSQLPersisting extends SQLPersisting {
  public schemaPreparation(schema: Schema): string {
    let Sql: string = '';
    Sql += `CREATE SCHEMA IF NOT EXISTS "${this.schemaName!}";` + '\n';
    for (const table of schema.tables) {
      Sql +=
        `DROP TABLE IF EXISTS ${this.tableIdentifier(table)} CASCADE;` + '\n';
    }
    return Sql;
  }

  // https://stackoverflow.com/questions/47925251/postgresql-update-row-based-on-the-same-table#:~:text=In%20Postgres%20SQL%2C%20you%20should%20not%20repeat%20the%20name%20of%20the%20target%20table%20in%20the%20FROM%20clause%20(so%20you%20cannot%20use%20a%20JOIN)
  /** The FROM-Clause is different to the MsSQl-Implementation.
   * In Postgres, you don't have to specify both tables but use the table you already specified in the UPDATE-Clause.
   */
  public override updateSurrogateKeySource(fk: TableRelationship): string {
    return this.tableIdentifier(fk.referencedTable);
  }

  /** The column is only necessary for the data transfer. We don't want to insert data later.
   * Thus, GENERATED ALWAYS options is sufficient */
  public override surrogateKeyString(name: string): string {
    return `${name} INT GENERATED ALWAYS AS IDENTITY`;
  }

  public escape(str: string) {
    return `"${str}"`;
  }
}
