import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();
  public readonly sourceTables = new Set<Table>();

  public constructor(...tables: Array<Table>) {
    tables.forEach((table) => this.sourceTables.add(table));
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

  public autoNormalize(...table: Array<Table>): Array<Table> {
    let queue = new Array(...table);
    let resultingTables = new Array<Table>();
    while (queue.length > 0) {
      let current = queue.shift()!;
      if (current.violatingFds().length > 0) {
        let children = this.split(current, current.violatingFds()[0]);
        queue.push(...children);
      } else {
        resultingTables.push(current);
      }
    }
    return resultingTables;
  }

  public join(table1: Table, table2: Table) {
    let newTable = table1.join(table2);
    this.setFdsFor(newTable, table1, table2);
    this.add(newTable);
    this.delete(table1);
    this.delete(table2);
    return newTable;
  }

  private setFdsFor(table: Table, parent1: Table, parent2: Table) {
    /*let sourceTables = new Set<Table>();
    table.columns.columns.forEach((column) => {
      sourceTables.add(column.sourceTable);
    });

    sourceTables.forEach((sourceTable) => {
      sourceTable.projectFds(table);
    });*/
    parent1.projectFds(table);
    parent2.projectFds(table);

    // extension
    let fk = parent1.columns.copy().intersect(parent2.columns);
    let fkFds1 = new Map<ColumnCombination, ColumnCombination>(); // fds from parent1 where lhs isSubsetOf fk
    let fkFds2 = new Map<ColumnCombination, ColumnCombination>(); // fds from parent2 where lhs isSubsetOf fk

    parent1.fds.forEach((fd) => {
      if (fd.lhs.isSubsetOf(fk)) fkFds1.set(fd.lhs, fd.rhs);
    });
    parent2.fds.forEach((fd) => {
      if (fd.lhs.isSubsetOf(fk)) fkFds2.set(fd.lhs, fd.rhs);
    });

    parent1.fds.forEach((fd) => {
      let rhsFkPart = fd.rhs.copy().intersect(fk);
      if (fkFds2.has(rhsFkPart)) {
        table.fds
          .filter((fd1) => fd1 == fd)[0]
          .rhs.union(fkFds2.get(rhsFkPart)!);
      }
    });
    parent2.fds.forEach((fd) => {
      let rhsFkPart = fd.rhs.copy().intersect(fk);
      if (fkFds1.has(rhsFkPart)) {
        table.fds
          .filter((fd1) => fd1 == fd)[0]
          .rhs.union(fkFds1.get(rhsFkPart)!);
      }
    });

    table.setFds(...new Set(table.fds)); //remove duplicate fds with lhs = fk subset
  }
}
