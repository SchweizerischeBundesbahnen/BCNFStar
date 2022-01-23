import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import Relationship from './Relationship';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();
  public readonly sourceTables = new Set<Table>();
  public readonly fkRelationships = new Set<Relationship>();
  public readonly indRelationships = new Set<Relationship>();

  public constructor(...tables: Array<Table>) {
    tables.forEach((table) => this.sourceTables.add(table));
    this.add(...tables);
  }

  public referencedTablesOf(table: Table): Set<Table> {
    let referencedTables = new Set<Table>();
    let references = [...this.fkRelationships].filter((rel) =>
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

  public indReferencedRelationshipsOf(table: Table): Set<Relationship> {
    return new Set(
      [...this.indRelationships].filter((rel) =>
        rel.referencing().isSubsetOf(table.columns)
      )
    );
  }

  public foreignKeyBetween(
    referencing: Table,
    referenced: Table
  ): ColumnCombination | undefined {
    for (let rel of this.fkRelationships) {
      if (rel.appliesTo(referencing, referenced)) return rel.referencing();
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

  public fkRelationshipBetween(table1: Table, table2: Table): Relationship {
    return [...this.fkRelationships].filter(
      (rel) => rel.appliesTo(table1, table2) || rel.appliesTo(table2, table1)
    )[0];
  }

  public indRelationshipBetween(
    table1: Table,
    table2: Table
  ): Set<Relationship> {
    return new Set(
      [...this.indRelationships].filter(
        (rel) => rel.appliesTo(table1, table2) || rel.appliesTo(table2, table1)
      )
    );
  }

  public split(table: Table, fd: FunctionalDependency) {
    let relationship = new Relationship();
    fd.lhs.columns.forEach((column) => {
      relationship.add(column.copy(), column);
    });
    let tables = table.split(fd, relationship);
    this.add(...tables);
    this.delete(table);
    this.fkRelationships.add(relationship);
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

  public basicJoin(table1: Table, table2: Table, relationship: Relationship) {
    let newTable = table1.join(table2, relationship);
    this.setFdsFor(newTable, table1, table2, relationship);
    this.add(newTable);
    this.delete(table1);
    this.delete(table2);
    this.fkRelationships.delete(relationship);
    return newTable;
  }

  public joinFk(table1: Table, table2: Table) {
    let relationship = [...this.fkRelationships].filter(
      (rel) => rel.appliesTo(table1, table2) || rel.appliesTo(table2, table1)
    )[0];
    return this.basicJoin(table1, table2, relationship);
  }

  public tablesForInd(relationship: Relationship): Array<Table> {
    let tables = new Array<Table>();
    for (let table of this.tables) {
      if (
        relationship.referencing().isSubsetOf(table.columns) ||
        relationship.referenced().isSubsetOf(table.columns)
      ) {
        tables.push(table);
        if (tables.length == 2) break;
      }
    }
    return tables;
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

    let remaining = relationship.appliesTo(parent1, parent2)
      ? parent1
      : parent2;
    let generating = relationship.appliesTo(parent1, parent2)
      ? parent2
      : parent1;

    remaining.projectFds(table);
    table.fds.forEach((fd) => {
      relationship.referencingToReferencedColumnsIn(fd.lhs);
      relationship.referencingToReferencedColumnsIn(fd.rhs);
    });
    generating.projectFds(table);

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
