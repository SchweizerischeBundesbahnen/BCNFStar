import SourceTable from './SourceTable';

export default class SourceTableInstance {
  public id = 1;
  public useId = false;
  public useAlias = false;

  constructor(public table: SourceTable, public customAlias?: string) {
    this.useAlias = !!customAlias;
  }

  public get baseAlias(): string {
    return this.customAlias || this.defaultName;
  }

  public get alias() {
    let alias = this.baseAlias;
    if (this.useId) alias += this.id.toString();
    return alias;
  }

  public get defaultName() {
    return this.table.fullName;
  }
}
