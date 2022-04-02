import IAttribute from '@server/definitions/IAttribute';
import * as _ from 'underscore';
import ColumnIdentifier from './ColumnIdentifier';

export default class Column {
  name: string;
  dataType: string;
  ordinalPosition: number;
  source: ColumnIdentifier;

  public constructor(
    name: string,
    dataType: string,
    ordinalPosition: number,
    source: ColumnIdentifier
  ) {
    this.name = name;
    this.dataType = dataType;
    this.ordinalPosition = ordinalPosition;
    this.source = source;
  }

  public copy(): Column {
    return new Column(
      this.name,
      this.dataType,
      this.ordinalPosition,
      this.source
    );
  }

  public equals(column: Column): boolean {
    return _.isEqual(this.source, column.source);
  }

  public toIAttribute(): IAttribute {
    return {
      name: this.name,
      table: this.source.table.name,
      dataType: this.dataType,
    };
  }
}
