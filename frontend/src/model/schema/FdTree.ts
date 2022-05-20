import Column from './Column';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';

export default class FdTree {
  private _children = new Map<Column, FdTree>();
  private _fd?: FunctionalDependency;
  constructor() {}

  addFd(fd: FunctionalDependency) {
    this.traverse(fd.lhs)._fd = fd;
  }

  static sortResult(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  static compareColumns(c1: Column, c2: Column): number {
    let val = FdTree.sortResult(c1.sourceColumn.name, c2.sourceColumn.name);
    if (val !== 0) return val;
    val = FdTree.sortResult(
      c1.sourceTableInstance.alias,
      c2.sourceTableInstance.alias
    );
    if (val !== 0) return val;
    return FdTree.sortResult(
      c1.sourceColumn.table.fullName,
      c1.sourceColumn.table.fullName
    );
  }

  static sortedColumns(cc: ColumnCombination): Array<Column> {
    return cc.asArray().sort(FdTree.compareColumns);
  }

  traverse(lhs: ColumnCombination) {
    let current: FdTree = this;
    for (const column of FdTree.sortedColumns(lhs)) {
      if (!current._children.has(column))
        current._children.set(column, new FdTree());
      current = current._children.get(column)!;
    }
    return current;
  }

  getEqualLhs(lhs: ColumnCombination): FunctionalDependency | undefined {
    return this.traverse(lhs)._fd;
  }

  getSubsets(lhs: ColumnCombination): Array<FunctionalDependency> {
    const result = [...this._children.entries()]
      .sort((val1, val2) => FdTree.compareColumns(val1[0], val2[0]))
      .map(([column, fdTree]) => {
        if (!lhs.includes(column) || lhs.cardinality === 1) return [];
        const newLhs = lhs.copy();
        newLhs.delete(column);
        return fdTree.getSubsets(newLhs);
      })
      .flat();
    if (this._fd) result.push(this._fd);

    return result;
  }
  all(): Array<FunctionalDependency> {
    const result: Array<FunctionalDependency> = [...this._children.values()]
      .map((fdTree) => fdTree.all())
      .flat();
    if (this._fd) result.push(this._fd);
    return result;
  }
}
