import FunctionalDependency from './FunctionalDependency';
import Relationship from './Relationship';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();
  public readonly fkRelationships = new Set<Relationship>();
  public readonly indRelationships = new Set<Relationship>();

  public constructor(...tables: Array<Table>) {
    this.add(...tables);
  }

  private referencesOf(
    table: Table,
    relationships: Set<Relationship>
  ): Set<Table> {
    let referencedTables = new Set<Table>();
    let references = [...relationships].filter((rel) =>
      rel.referencing().isSubsetOf(table.columns)
    );
    this.tables.forEach((t) => {
      if (
        references.filter((rel) => rel.referenced().isSubsetOf(t.columns))
          .length > 0
      ) {
        referencedTables.add(t);
      }
    });
    return referencedTables;
  }

  public fksOf(table: Table): Set<Table> {
    let fks = this.referencesOf(table, this.fkRelationships);
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
    return fks;
  }

  public indsOf(table: Table): Set<Table> {
    return this.referencesOf(table, this.indRelationships);
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
    return new Set(
      [...this.indRelationships].filter((rel) =>
        rel.appliesTo(referencing, referenced)
      )
    );
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

    //TODO remove duplicate fds (lhs = fk subset)
  }
}
