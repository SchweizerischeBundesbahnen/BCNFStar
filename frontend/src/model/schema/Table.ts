import Column from './Column';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import ITable from '@server/definitions/ITable';

export default class Table {
  public name = '';
  public readonly columns = new ColumnCombination();
  public pk?: ColumnCombination = undefined;
  public fds: Array<FunctionalDependency> = [];
  public readonly referencedTables = new Set<Table>();
  public readonly referencingTables = new Set<Table>();
  public readonly origin: Table;

  public constructor(columns?: ColumnCombination, origin?: Table) {
    if (columns) this.columns = columns;
    this.origin = origin ? origin : this;
  }

  public static fromITable(iTable: ITable): Table {
    let columns = new ColumnCombination();
    iTable.attribute.forEach((iAttribute, index) => {
      columns.add(new Column(iAttribute.name, iAttribute.dataType, index));
    });
    let table = new Table(columns);
    table.name = iTable.name;
    return table;
  }

  public static fromColumnNames(...names: Array<string>) {
    const table: Table = new Table();
    names.forEach((name, i) =>
      table.columns.add(new Column(name, 'unknown data type', i))
    );
    return table;
  }

  public get numColumns(): number {
    return this.columns.cardinality;
  }

  public setFds(...fds: Array<FunctionalDependency>) {
    this.fds = fds;
    this.fds = fds.filter((fd) => !fd.isFullyTrivial());
  }

  public addFd(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.fds.push(new FunctionalDependency(this, lhs, rhs));
  }

  public remainingSchema(fd: FunctionalDependency): ColumnCombination {
    return this.columns.copy().setMinus(fd.rhs).union(fd.lhs);
  }

  public generatingSchema(fd: FunctionalDependency): ColumnCombination {
    return fd.rhs.copy();
  }

  public split(fd: FunctionalDependency): Array<Table> {
    let remaining: Table = this.constructProjection(this.remainingSchema(fd));
    let generating: Table = this.constructProjection(this.generatingSchema(fd));

    remaining.pk = this.pk;
    generating.pk = fd.lhs.copy();

    remaining.name = this.name;
    generating.name = fd.lhs.columnNames().join('_').substring(0, 50);

    remaining.referencedTables.add(generating);
    generating.referencingTables.add(remaining);

    return [remaining, generating];
  }

  public constructProjection(cc: ColumnCombination): Table {
    const table: Table = new Table(cc, this.origin);

    this.fds.forEach((fd) => {
      if (fd.lhs.isSubsetOf(cc)) {
        fd = new FunctionalDependency(
          table,
          fd.lhs.copy(),
          fd.rhs.copy().intersect(cc)
        );
        if (!fd.isFullyTrivial()) {
          table.fds.push(fd);
        }
      }
    });

    this.referencedTables.forEach((refTable) => {
      if (this.foreignKeyForReferencedTable(refTable).isSubsetOf(cc)) {
        table.referencedTables.add(refTable);
        refTable.referencingTables.add(table);
      }
    });

    this.referencingTables.forEach((refTable) => {
      if (refTable.foreignKeyForReferencedTable(this).isSubsetOf(cc)) {
        table.referencingTables.add(refTable);
        refTable.referencedTables.add(table);
      }
    });

    return table;
  }

  public join(otherTable: Table): Table {
    let newTable = this.origin.constructProjection(
      this.columns.copy().union(otherTable.columns)
    );

    this.referencedTables.forEach((refTable) =>
      newTable.referencedTables.add(refTable)
    );
    otherTable.referencedTables.forEach((refTable) =>
      newTable.referencedTables.add(refTable)
    );

    this.referencingTables.forEach((refTable) =>
      newTable.referencingTables.add(refTable)
    );
    otherTable.referencingTables.forEach((refTable) =>
      newTable.referencingTables.add(refTable)
    );

    let remaining: Table;
    let generating: Table;
    if (this.referencedTables.has(otherTable)) {
      remaining = this;
      generating = otherTable;
    } else {
      remaining = otherTable;
      generating = this;
    }

    newTable.referencedTables.delete(generating);
    newTable.referencingTables.delete(remaining);

    newTable.name = remaining.name;
    newTable.pk = remaining.pk;

    return newTable;
  }

  public foreignKeyForReferencedTable(refTable: Table): ColumnCombination {
    return this.columns.copy().intersect(refTable.columns);
  }

  public keys(): Array<ColumnCombination> {
    let keys: Array<ColumnCombination> = this.fds
      .filter((fd) => fd.isKey())
      .map((fd) => fd.lhs);
    if (keys.length == 0) keys.push(this.columns.copy());
    return keys.sort((cc1, cc2) => cc1.cardinality - cc2.cardinality);
  }

  public foreignKeys(): Array<ColumnCombination> {
    let foreignKeys: Array<ColumnCombination> = [];
    this.referencedTables.forEach((table) =>
      foreignKeys.push(this.foreignKeyForReferencedTable(table))
    );
    return foreignKeys;
  }

  public hasForeignKeyWith(column: Column): boolean {
    return this.foreignKeys().some((cc) => cc.includes(column));
  }

  public minimalReferencedTables(): Array<Table> {
    var result: Set<Table> = new Set(this.referencedTables);

    var visited: Array<Table> = [];
    visited.push(this);

    var queue: Array<Table> = [];
    queue.push(...this.referencedTables);
    while (queue.length > 0) {
      var current = queue.shift();
      visited.push(current!);
      for (const refTable of current!.referencedTables) {
        if (result.has(refTable)) {
          result.delete(refTable);
        }
        if (!visited.includes(refTable)) {
          queue.push(refTable);
        }
      }
    }
    return [...result];
  }

  public violatingFds(): Array<FunctionalDependency> {
    return this.fds
      .filter((fd) => fd.violatesBCNF())
      .sort((fd1, fd2) => {
        let comparison = fd1.lhs.cardinality - fd2.lhs.cardinality;
        if (comparison == 0)
          comparison = fd2.rhs.cardinality - fd1.rhs.cardinality;
        return comparison;
      });
  }

  public toString(): string {
    let str = `${this.name}(${this.columns.toString()})\n`;
    str += this.fds.map((fd) => fd.toString()).join('\n');
    return str;
  }
}
