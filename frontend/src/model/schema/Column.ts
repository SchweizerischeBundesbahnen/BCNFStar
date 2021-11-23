export default class Column {
  name: string;
  prio: number;

  public constructor(name: string, prio: number) {
    this.name = name;
    this.prio = prio;
  }
}
