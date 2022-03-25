import IAttribute from '@server/definitions/IAttribute';
import ColumnIdentifier from './ColumnIdentifier';

export default class Column {
  name: string;
  dataType: string;
  prio: number;
  source: ColumnIdentifier;

  public constructor(
    name: string,
    dataType: string,
    prio: number,
    source: ColumnIdentifier
  ) {
    this.name = name;
    this.dataType = dataType;
    this.prio = prio;
    this.source = source;
  }

  public copy(): Column {
    return new Column(this.name, this.dataType, this.prio, this.source);
  }

  public equals(column: Column): boolean {
    return this.source == column.source;
  }

  public toIAttribute(): IAttribute {
    return {
      name: this.name,
      table: this.source.table.name,
      dataType: this.dataType,
    };
  }
}
