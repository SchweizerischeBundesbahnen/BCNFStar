import Column from './Column';
import ColumnCombination from './ColumnCombination';

/**
 * Abstract data class that associates ColumnCombinations
 * with some data of type T. You can query with ColumnCombinations
 * to get the stored value of the exact CC or of a subset.
 * Technically it is like a prefix tree, but unlike in a prefix tree theorder
 * of the columns doesn't matter here, as all incoming columns are sorted.
 */
export default class ColumnsTree<T> {
  private _children = new Map<Column, ColumnsTree<T>>();
  private _content?: T;

  /** Helper to cleanup sort functions*/
  static sortResult(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /** Helper to sort an array of columns. The sorted array is used to have an
   * unambiguous path through the tree. Should check for all fields referenced in Column.equals
   */
  static compareColumns(c1: Column, c2: Column): number {
    let val = ColumnsTree.sortResult(
      c1.sourceColumn.name,
      c2.sourceColumn.name
    );
    if (val !== 0) return val;
    val = ColumnsTree.sortResult(
      c1.sourceTableInstance.alias,
      c2.sourceTableInstance.alias
    );
    if (val !== 0) return val;
    return ColumnsTree.sortResult(
      c1.sourceColumn.table.fullName,
      c1.sourceColumn.table.fullName
    );
  }

  /**
   * @returns Columns sorted to be a path along the tree
   */
  static sortedColumns(cc: ColumnCombination): Array<Column> {
    return cc.asArray().sort(ColumnsTree.compareColumns);
  }

  /**
   * Adds a value to the tree
   * @param content the value to be set
   * @param columns the location to store the value at
   */
  public add(content: T, columns: ColumnCombination) {
    this.traverse(columns)._content = content;
  }

  /**
   * @returns the value stored at `columns`, or undefined if nothing is there
   */
  public get(columns: ColumnCombination): T | undefined {
    return this.traverse(columns)._content;
  }

  private traverse(columns: ColumnCombination) {
    let current: ColumnsTree<T> = this;
    for (const column of ColumnsTree.sortedColumns(columns)) {
      if (!current._children.has(column))
        current._children.set(column, new ColumnsTree());
      current = current._children.get(column)!;
    }
    return current;
  }

  private sortedEntries() {
    return [...this._children.entries()].sort((val1, val2) =>
      ColumnsTree.compareColumns(val1[0], val2[0])
    );
  }

  /**
   * @returns all values stored in the tree for a subset of the given `columns`
   */
  public getSubsets(columns: ColumnCombination): Array<T> {
    const result = this.sortedEntries()
      .map(([column, LhsTree]) => {
        if (!columns.includes(column) || columns.cardinality === 0) return [];
        const newLhs = columns.copy();
        newLhs.delete(column);
        return LhsTree.getSubsets(newLhs);
      })
      .flat();
    if (this._content !== undefined) result.push(this._content);
    return result;
  }

  /**
   * @returns a ColumnsTree containing only values stored at a subset of `columns`
   */
  getSubtree(columns: ColumnCombination): ColumnsTree<T> {
    const newTree = new ColumnsTree<T>();
    newTree._content = this._content;
    for (const [column, subtree] of this.sortedEntries()) {
      if (columns.includes(column)) {
        const newColums = columns.copy();
        newColums.delete(column);
        newTree._children.set(column, subtree.getSubtree(newColums));
      }
    }
    return newTree;
  }

  /** returns all values stored in this tree */
  public getAll(): Array<T> {
    const result: Array<T> = this.sortedEntries()
      .map(([, columnsTree]) => columnsTree.getAll())
      .flat();
    if (this._content !== undefined) result.push(this._content);
    return result;
  }
}
