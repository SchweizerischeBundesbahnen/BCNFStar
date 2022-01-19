import FunctionalDependency from './FunctionalDependency';
import Relationship from './Relationship';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();
  public readonly sourceTables = new Set<Table>();
  public readonly fkRelationships = new Set<Relationship>();

  public constructor(...tables: Array<Table>) {
    tables.forEach((table) => this.sourceTables.add(table));
    this.add(...tables);
  }

  public referencedTablesOf(table: Table): Set<Table> {
    let referencedTables = new Set<Table>();
    let references = [...this.fkRelationships].filter((rel) =>
      rel.referencing.isSubsetOf(table.columns)
    );
    this.tables.forEach((t) => {
      let intersect = table.columns.copy().intersect(t.columns);
      if (
        (intersect.cardinality > 0 && t.pk && t.pk!.equals(intersect)) ||
        references.filter((rel) => rel.referenced.isSubsetOf(t.columns))[0]
      ) {
        referencedTables.add(t);
      }
    });
    return referencedTables;

    // referenzen + tables*relevante_referenzen
  }

  public foreignKeyBetween(referencing: Table, referenced: Table) {
    let intersect = referencing.columns.copy().intersect(referenced.columns);
    if (
      intersect.cardinality > 0 &&
      referenced.pk &&
      referenced.pk!.equals(intersect)
    )
      for (const rel of this.fkRelationships) {
        if (rel.appliesTo(referencing, referenced)) return rel;
      }
    return undefined;
  }

  public add(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.add(table);
    });
  }

  public delete(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.delete(table);
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
    let fkFds1 = parent1.fds.filter((fd) => fd.lhs.isSubsetOf(fk));
    let fkFds2 = parent2.fds.filter((fd) => fd.lhs.isSubsetOf(fk));

    table.fds.forEach((fd) => {
      let rhsFkPart = fd.rhs.copy().intersect(fk);
      let extension1 = fkFds1.filter((parentFd) =>
        parentFd.lhs.equals(rhsFkPart)
      );
      let extension2 = fkFds2.filter((parentFd) =>
        parentFd.lhs.equals(rhsFkPart)
      );
      if (extension1.length > 0) fd.rhs.union(extension1[0].rhs);
      if (extension2.length > 0) fd.rhs.union(extension2[0].rhs);
    });

    table.setFds(...new Set(table.fds)); //remove duplicate fds with lhs = fk subset
  }
}
