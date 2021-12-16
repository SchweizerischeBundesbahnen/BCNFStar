//import { assert } from 'console';
import Column from './Column';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import ITable from '@server/definitions/ITable';

export default class Table {
  name: string = '';
  columns: ColumnCombination = new ColumnCombination();
  pk?: ColumnCombination;
  fds: FunctionalDependency[] = [];
  children: Table[] = new Array(2);
  referencedTables: Table[] = [];
  referencingTables: Table[] = [];

  public constructor(columns?: ColumnCombination) {
    if (columns) this.columns = columns;
  }

  public static fromITable(iTable: ITable): Table {
    let columns = new ColumnCombination();
    iTable.attribute.forEach((iAttribute, index) => {
      columns.add(new Column(iAttribute.name, iAttribute.dataType, index));
    });
    let table = new Table(columns);
    table.name = iTable.name; //mermaid tablenames must not contain dots
    return table;
  }

  public static fromColumnNames(...names: string[]) {
    const table: Table = new Table();
    names.forEach((name, i) =>
      table.columns.add(new Column(name, 'unknown data type', i))
    );
    return table;
  }

  public get numColumns(): number {
    return this.columns.cardinality;
  }

  public get hasChildren(): boolean {
    return !!this.children[0];
  }

  public setFds(...fds: FunctionalDependency[]) {
    this.fds = fds;
    this.extendFds();
    this.fds = fds.filter((fd) => !fd.isFullyTrivial());
  }

  public addFd(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.fds.push(new FunctionalDependency(this, lhs, rhs));
  }

  public allResultingTables(): Table[] {
    if (!this.hasChildren) return [this];
    return this.children[0]
      .allResultingTables()
      .concat(this.children[1].allResultingTables());
  }

  public extendFds() {
    this.fds.forEach((fd) => fd.extend());
  }

  public remainingSchema(fd: FunctionalDependency): ColumnCombination {
    return this.columns.copy().setMinus(fd.rhs).union(fd.lhs);
  }

  public generatingSchema(fd: FunctionalDependency): ColumnCombination {
    return fd.rhs.copy();
  }

  public split(fd: FunctionalDependency): Table[] {
    //assert(this.fds.includes(fd));
    this.children[0] = this.constructProjection(this.remainingSchema(fd));
    this.children[1] = this.constructProjection(this.generatingSchema(fd));
    this.children[0].pk = this.pk;
    this.children[1].pk = fd.lhs.copy();
    this.children[0].referencedTables.push(this.children[1]);
    this.children[1].referencingTables.push(this.children[0]);
    this.children[0].name = this.name;
    this.children[1].name = fd.lhs.columnNames().join('_').substring(0, 50);
    return this.children;
  }

  public constructProjection(cc: ColumnCombination): Table {
    const table: Table = new Table(cc);
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
        table.referencedTables.push(refTable);
        refTable.referencingTables.push(table);
      }
    });
    this.referencingTables.forEach((refTable) => {
      if (refTable.foreignKeyForReferencedTable(this).isSubsetOf(cc)) {
        table.referencingTables.push(refTable);
        refTable.referencedTables.push(table);
      }
    });
    return table;
  }

  public foreignKeyForReferencedTable(refTable: Table): ColumnCombination {
    //assert(this.referencedTables.includes(refTable));
    return this.columns.copy().intersect(refTable.columns);
  }

  public keys(): ColumnCombination[] {
    let keys: Array<ColumnCombination> = this.fds
      .filter((fd) => fd.isKey())
      .map((fd) => fd.lhs);
    if (keys.length == 0) keys.push(this.columns.copy());
    return keys.sort((cc1, cc2) => cc1.cardinality - cc2.cardinality);
  }

  public foreignKeys(): ColumnCombination[] {
    return this.referencedTables.map((table) =>
      this.foreignKeyForReferencedTable(table)
    );
  }

  public minimalReferencedTables(): Array<Table> {
    var result: Set<Table> = new Set(this.referencedTables);

    var visited: Array<Table> = [];
    visited.push(this);

    var queue: Array<Table> = [];
    queue.push(...this.referencedTables);
    console.log('ho');
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

  public violatingFds(): FunctionalDependency[] {
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
