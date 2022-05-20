import Column from './Column';
import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class LhsTree<T> {
  private _children = new Map<Column, LhsTree<T>>();
  private _content?: T;
  constructor() {}

  add(fd: T, lhs: ColumnCombination) {
    this.traverse(lhs)._content = fd;
  }

  static sortResult(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  static compareColumns(c1: Column, c2: Column): number {
    let val = LhsTree.sortResult(c1.sourceColumn.name, c2.sourceColumn.name);
    if (val !== 0) return val;
    val = LhsTree.sortResult(
      c1.sourceTableInstance.alias,
      c2.sourceTableInstance.alias
    );
    if (val !== 0) return val;
    return LhsTree.sortResult(
      c1.sourceColumn.table.fullName,
      c1.sourceColumn.table.fullName
    );
  }

  static sortedColumns(cc: ColumnCombination): Array<Column> {
    return cc.asArray().sort(LhsTree.compareColumns);
  }

  traverse(lhs: ColumnCombination) {
    let current: LhsTree<T> = this;
    for (const column of LhsTree.sortedColumns(lhs)) {
      if (!current._children.has(column))
        current._children.set(column, new LhsTree());
      current = current._children.get(column)!;
    }
    return current;
  }

  public getEqualLhs(lhs: ColumnCombination): T | undefined {
    return this.traverse(lhs)._content;
  }

  public getSubsets(lhs: ColumnCombination): Array<T> {
    console.log('calling getSubsets with ' + lhs);
    console.log(this);
    console.log(this._content);
    const result = [...this._children.entries()]
      .sort((val1, val2) => LhsTree.compareColumns(val1[0], val2[0]))
      .map(([column, LhsTree]) => {
        if (!lhs.includes(column) || lhs.cardinality === 0) return [];
        const newLhs = lhs.copy();
        newLhs.delete(column);
        return LhsTree.getSubsets(newLhs);
      })
      .flat();

    if (this._content) result.push(this._content);

    return result;
  }
  public getAll(): Array<T> {
    const result: Array<T> = [...this._children.values()]
      .map((LhsTree) => LhsTree.getAll())
      .flat();
    if (this._content) result.push(this._content);
    return result;
  }
}

const t = Table.fromColumnNames(['a', 'b', 'c', 'd'], 't');
const l = new LhsTree<string>();

const [a, b, c] = t.columns;

l.add('abc', new ColumnCombination([a, b, c]));
l.add('ab', new ColumnCombination([a, b]));
l.add('ac', new ColumnCombination([a, c]));

console.log(l);

// console.log(l.getSubsets(new ColumnCombination([a, b, c, d])))
// console.log(l.getSubsets(new ColumnCombination([a, b])))
// console.log(l.getEqualLhs(new ColumnCombination([a, c])))
// console.log(l.getAll())
