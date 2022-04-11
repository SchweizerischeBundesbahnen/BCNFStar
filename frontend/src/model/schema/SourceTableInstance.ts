import SourceTable from './SourceTable';

export default class SourceTableInstance {
  public alias: string;

  constructor(public table: SourceTable, alias?: string) {
    this.alias = alias ? alias : table.name;
  }

  public get fullName() {
    return this.table.fullName;
  }
}
