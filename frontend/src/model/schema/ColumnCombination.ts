import Column from "./Column";

export default class ColumnCombination {
  columns: Set<Column> = new Set();

  public constructor(...columns: Column[]) {
    this.add(...columns);
  }

  public copy(): ColumnCombination {
    return new ColumnCombination(...this.columns);
  }

  public subsetFromIds(...numbers: number[]) {
    return new ColumnCombination(
      ...this.orderedColumns().filter((col, i) => numbers.includes(i))
    );
  }

  public add(...columns: Column[]) {
    columns.forEach((col) => this.columns.add(col));
  }

  public includes(column: Column) {
    return this.columns.has(column);
  }

  public get cardinality(): number {
    return this.columns.size;
  }

  public equals(other: ColumnCombination): boolean {
    return this.cardinality == other.cardinality && this.isSubsetOf(other);
  }

  public intersect(other: ColumnCombination): ColumnCombination {
    this.columns.forEach((col) => {
      if (!other.includes(col)) this.columns.delete(col);
    });
    return this;
  }

  public union(other: ColumnCombination): ColumnCombination {
    other.columns.forEach((col) => this.columns.add(col));
    return this;
  }

  public setMinus(other: ColumnCombination): ColumnCombination {
    other.columns.forEach((col) => this.columns.delete(col));
    return this;
  }

  public isSubsetOf(other: ColumnCombination): boolean {
    return [...this.columns].every((col) => other.includes(col));
  }

  public orderedColumns(): Column[] {
    return [...this.columns].sort((col1, col2) => col1.prio - col2.prio);
  }

  public columnNames(): string[] {
    return this.orderedColumns().map((col) => col.name);
  }

  public toString(): string {
    return this.columnNames().join(", ");
  }
}
