import SourceTable from './SourceTable';

export default class SourceTableInstance {
  /**
   * Number to append to the baseAlias to enforce that the aliases of sources are unique in one table
   */
  public id = 1;
  /**
   * Whether the id is needed to enforce unique source names. See id
   */
  public useId = false;
  /**
   * Whether an alias is used. This is either the case when the user specifies an alias or when the same SourceTable
   * is used more than once in a Table
   */
  public useAlias = false;

  constructor(public table: SourceTable, public customAlias?: string) {
    this.useAlias = !!customAlias;
  }

  public get baseAlias(): string {
    return this.customAlias || this.defaultName;
  }

  /**
   * An alias for the source. This must be unique in one table
   */
  public get alias() {
    let alias = this.baseAlias;
    if (this.useId) alias += this.id.toString();
    return alias;
  }

  public get identifier() {
    return this.useAlias ? this.alias : this.table.name;
  }

  public get defaultName() {
    return this.table.name;
  }

  public equals(other: SourceTableInstance): boolean {
    return this.alias == other.alias;
  }
}
