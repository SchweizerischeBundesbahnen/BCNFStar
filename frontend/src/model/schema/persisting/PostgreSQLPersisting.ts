import Schema from '../Schema';
import SQLPersisting from './SQLPersisting';

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

  public escape(str: string) {
    return `"${str}"`;
  }
}
