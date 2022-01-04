import FunctionalDependency from './FunctionalDependency';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();

  public constructor(...tables: Array<Table>) {
    this.add(...tables);
  }

  public add(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.add(table);
      table.referencedTables.forEach((refTable) =>
        refTable.referencingTables.add(table)
      );
      table.referencingTables.forEach((refTable) =>
        refTable.referencedTables.add(table)
      );
    });
  }

  public delete(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.delete(table);
      table.referencedTables.forEach((refTable) =>
        refTable.referencingTables.delete(table)
      );
      table.referencingTables.forEach((refTable) =>
        refTable.referencedTables.delete(table)
      );
    });
  }

  public split(table: Table, fd: FunctionalDependency) {
    let tables = table.split(fd);
    this.add(...tables);
    this.delete(table);
    return tables;
  }

  public join(table1: Table, table2: Table) {
    let newTable = table1.join(table2);
    this.add(newTable);
    this.delete(table1);
    this.delete(table2);
    return newTable;
  }
}
