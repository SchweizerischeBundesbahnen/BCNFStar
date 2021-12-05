//import { assert } from 'console';
import Column from './Column';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import ITable from '../../../../server/definitions/ITable';

export default class Table {
  name: string = '';
  columns: ColumnCombination = new ColumnCombination();
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
    names.forEach((name, i) => table.columns.add(new Column(name, '?', i)));
    return table;
  }

  public get mermaidName(): string {
    return this.name
      .replace('.', '_')
      .replace(' ', '')
      .replace('}', '')
      .replace('{', '');
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
    return keys;
  }

  public foreignKeys(): ColumnCombination[] {
    return this.referencedTables.map((table) =>
      this.foreignKeyForReferencedTable(table)
    );
  }

  public violatingFds(): FunctionalDependency[] {
    return this.fds.filter((fd) => fd.violatesBCNF());
  }

  public toString(): string {
    let str = `${this.name}(${this.columns.toString()})\n`;
    str += this.fds.map((fd) => fd.toString()).join('\n');
    return str;
  }

  public toMermaidString(): string {
    let result = 'class '.concat(this.mermaidName, '{\n');
    this.columns.inOrder().forEach((column) => {
      result = result.concat(column.dataType, ' ', column.name, '\n');
    });
    result = result.concat('}');
    this.referencedTables.forEach((refTable) => {
      if (!refTable.hasChildren) {
        result = result.concat(
          '\n',
          this.mermaidName,
          ' --> ',
          refTable.mermaidName
        );
      }
    });
    return result;
  }
}
