import IAttribute from '@server/definitions/IAttribute';
import Table from './Table';

export default class Column {
  name: string;
  dataType: string;
  prio: number;
  sourceTable: Table;

  public constructor(
    name: string,
    dataType: string,
    prio: number,
    sourceTable: Table
  ) {
    this.name = name;
    this.dataType = dataType;
    this.prio = prio;
    this.sourceTable = sourceTable;
  }

  public copy(): Column {
    return new Column(this.name, this.dataType, this.prio, this.sourceTable);
  }

  public equals(column: Column): boolean {
    return this.sourceTable == column.sourceTable && this.name == column.name;
  }

  public toIAttribute(): IAttribute {
    return {
      name: this.name,
      table: this.sourceTable.name,
      dataType: this.dataType,
    };
  }
}
