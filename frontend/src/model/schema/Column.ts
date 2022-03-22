import Table from './Table';

export default class Column {
  name: string;
  dataType: string;
  ordinalPosition: number;
  sourceTable: Table;

  public constructor(
    name: string,
    dataType: string,
    ordinalPosition: number,
    sourceTable: Table
  ) {
    this.name = name;
    this.dataType = dataType;
    this.ordinalPosition = ordinalPosition;
    this.sourceTable = sourceTable;
  }

  public copy(): Column {
    return new Column(
      this.name,
      this.dataType,
      this.ordinalPosition,
      this.sourceTable
    );
  }

  public equals(column: Column): boolean {
    return this.sourceTable == column.sourceTable && this.name == column.name;
  }
}
