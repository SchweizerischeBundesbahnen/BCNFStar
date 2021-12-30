import FunctionalDependency from './FunctionalDependency';
import Table from './Table';

export default class Schema {
  tables = new Set<Table>();

  public constructor(...tables: Array<Table>) {
    this.add(...tables);
  }

  public add(...tables: Array<Table>) {
    tables.forEach((table) => this.tables.add(table));
  }

  public split(table: Table, fd: FunctionalDependency) {
    this.tables.delete(table);
    let tables = table.split(fd);
    this.add(...tables);
    return tables;
  }
}
