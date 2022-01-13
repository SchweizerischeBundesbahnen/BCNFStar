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
}
