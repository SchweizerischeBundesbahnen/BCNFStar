import Column from './Column';

export default class ColumnCombination {
  columns = new Set<Column>();

  public constructor(...columns: Array<Column>) {
    this.add(...columns);
  }

  public copy(): ColumnCombination {
    return new ColumnCombination(...this.columns);
  }

  public columnsFromNames(...names: Array<string>) {
    return new ColumnCombination(
      ...[...this.columns].filter((column: Column) =>
        names.includes(column.name)
      )
    );
  }

  public columnFromName(names: string) {
    return [...this.columns].filter((column: Column) =>
      names.includes(column.name)
    )[0];
  }

  public columnsFromIds(...numbers: Array<number>) {
    return new ColumnCombination(
      ...this.inOrder().filter((col, i) => numbers.includes(i))
    );
  }

  public add(...columns: Array<Column>) {
    columns.forEach((col) => {
      if (!this.includes(col)) this.columns.add(col);
    });
  }

  public delete(...columns: Array<Column>) {
    columns.forEach((column) => {
      this.columns = new Set(
        [...this.columns].filter((col) => !col.equals(column))
      );
    });
  }

  public includes(column: Column): boolean {
    return [...this.columns].some((col) => col.equals(column));
  }

  public get cardinality(): number {
    return this.columns.size;
  }

  public equals(other: ColumnCombination): boolean {
    return this.cardinality == other.cardinality && this.isSubsetOf(other);
  }

  public intersect(other: ColumnCombination): ColumnCombination {
    this.columns.forEach((col) => {
      if (!other.includes(col)) this.delete(col);
    });
    return this;
  }

  public union(other: ColumnCombination): ColumnCombination {
    other.columns.forEach((col) => this.add(col));
    return this;
  }

  public setMinus(other: ColumnCombination): ColumnCombination {
    other.columns.forEach((col) => this.delete(col));
    return this;
  }

  public isSubsetOf(other: ColumnCombination): boolean {
    return [...this.columns].every((col) => other.includes(col));
  }

  public inOrder(): Array<Column> {
    return [...this.columns].sort((col1, col2) => col1.prio - col2.prio);
  }

  public columnNames(): Array<string> {
    return this.inOrder().map((col) => col.name);
  }

  public toString(): string {
    return this.columnNames().join(', ');
  }
}
