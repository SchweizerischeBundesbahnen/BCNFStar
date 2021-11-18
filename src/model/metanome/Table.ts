import { assert } from "console";
import Column from "./Column";
import ColumnCombination from "./ColumnCombination";
import FunctionalDependency from "./FunctionalDependency";

export default class Table {
  columns: ColumnCombination = new ColumnCombination();
  fds: FunctionalDependency[] = [];

  public constructor(columns?: ColumnCombination) {
    if (columns) this.columns = columns;
  }

  public static fromColumnNames(...names: string[]) {
    const table: Table = new Table();
    names.forEach((name, i) => table.columns.add(new Column(name, i)));
    return table;
  }

  public addFd(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.fds.push(new FunctionalDependency(this, lhs, rhs));
  }

  public get numColumns(): number {
    return this.columns.cardinality;
  }

  public extendFds() {
    this.fds.forEach((fd) => fd.extend());
  }

  public split(fd: FunctionalDependency): Table[] {
    assert(this.fds.includes(fd));
    const children: Table[] = Array(2);
    children[0] = this.constructProjection(
      this.columns.copy().setMinus(fd.rhs).union(fd.lhs)
    );
    children[1] = this.constructProjection(fd.rhs.copy());
    return children;
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
    return table;
  }

  public violatingFds(): FunctionalDependency[] {
    return this.fds.filter((fd) => fd.violatesBCNF());
  }

  public toString(): string {
    let str = `Table(${this.columns.columnNames().join(", ")})\n`;
    str += this.fds.map((fd) => fd.toString()).join("\n");
    return str;
  }
}
