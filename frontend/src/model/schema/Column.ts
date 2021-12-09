export default class Column {
  name: string;
  dataType: string;
  prio: number;

  public constructor(name: string, dataType: string, prio: number) {
    this.name = name;
    this.dataType = dataType;
    this.prio = prio;
  }
}
