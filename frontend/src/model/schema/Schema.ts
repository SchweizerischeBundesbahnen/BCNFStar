import FunctionalDependency from './FunctionalDependency';
import Relationship from './Relationship';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();
  public readonly fkRelationships = new Set<Relationship>();
  public readonly indRelationships = new Set<Relationship>();
  public readonly formerIndRelationship = new Set<Relationship>();

  public constructor(...tables: Array<Table>) {
    this.add(...tables);
  }

  public fksOf(table: Table): Set<Table> {
    let fks = new Set<Table>();
    // intersects
    this.tables.forEach((otherTable) => {
      let intersect = table.columns.copy().intersect(otherTable.columns);
      if (
        intersect.cardinality > 0 &&
        otherTable.pk &&
        otherTable.pk!.equals(intersect)
      )
        fks.add(otherTable);
    });
    fks.delete(table);
    // fkRelationships
    let references = [...this.fkRelationships].filter((rel) =>
      rel.referencing().isSubsetOf(table.columns)
    );
    this.tables.forEach((t) => {
      if (t.pk && references.some((rel) => t.pk!.equals(rel.referenced()))) {
        fks.add(t);
      }
    });
    return fks;
  }

  public indsOf(table: Table): Set<Table> {
    let inds = new Set<Table>();
    let references = [...this.indRelationships].filter((rel) =>
      rel.referencing().isSubsetOf(table.columns)
    );
    this.tables.forEach((t) => {
      if (references.some((rel) => rel.appliesTo(table, t))) {
        inds.add(t);
      }
    });
    return inds;
  }

  public fksBetween(referencing: Table, referenced: Table): Set<Relationship> {
    let fks = new Set(
      [...this.fkRelationships].filter((rel) =>
        rel.appliesTo(referencing, referenced)
      )
    );
    let intersect = referencing.columns.copy().intersect(referenced.columns);
    if (
      intersect.cardinality > 0 &&
      referenced.pk &&
      referenced.pk!.equals(intersect)
    )
      fks.add(Relationship.fromTables(referencing, referenced));
    return fks;
  }

  public indsBetween(referencing: Table, referenced: Table): Set<Relationship> {
    let result = new Set(
      [...this.indRelationships].filter((rel) =>
        rel.appliesTo(referencing, referenced)
      )
    );
    return result;
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

  public join(table1: Table, table2: Table, relationship: Relationship) {
    let newTable = table1.join(table2, relationship);
    this.setFdsFor(newTable, table1, table2, relationship);
    this.add(newTable);
    this.delete(table1);
    this.delete(table2);
    return newTable;
  }

  private setFdsFor(
    table: Table,
    parent1: Table,
    parent2: Table,
    relationship: Relationship
  ) {
    let referencing = relationship.appliesTo(parent1, parent2)
      ? parent1
      : parent2;
    let referenced = relationship.appliesTo(parent1, parent2)
      ? parent2
      : parent1;

    // copy parent fds
    referenced.fds.forEach((fd) => {
      table.addFd(fd.lhs.copy(), fd.rhs.copy());
    });
    referencing.fds.forEach((fd) => {
      let newLhs = relationship.referencingToReferencedColumnsIn(fd.lhs);
      let newRhs = relationship.referencingToReferencedColumnsIn(fd.rhs);
      if (newLhs.isSubsetOf(relationship.referenced())) {
        let correspondingFd = table.fds.find((fd) => fd.lhs.equals(newLhs));
        if (correspondingFd) correspondingFd.rhs.union(newRhs);
        else table.addFd(newLhs, newRhs);
      } else {
        table.addFd(newLhs, newRhs);
      }
    });

    // extension
    let fk = relationship.referenced();
    let fkFds = table.fds.filter((fd) => fd.lhs.isSubsetOf(fk));
    table.fds.forEach((fd) => {
      let rhsFkPart = fd.rhs.copy().intersect(fk);
      fkFds
        .filter((fkFd) => fkFd.lhs.isSubsetOf(rhsFkPart))
        .forEach((fkFd) => {
          fd.rhs.union(fkFd.rhs);
        });
    });
  }
}
