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
  public userAlias?: string;

  constructor(public table: SourceTable, userAlias?: string) {
    this.setUserAlias(userAlias);
  }

  public get baseAlias(): string {
    return this.userAlias ?? this.defaultName;
  }

  /**
   * An alias for the source. This must be unique in one table
   */
  public get alias() {
    let alias = this.baseAlias;
    if (this.useId) alias += this.id.toString();
    return alias;
  }

  public get defaultName() {
    return this.table.name;
  }

  public setUserAlias(newAlias?: string) {
    if (!newAlias || newAlias == this.defaultName) this.userAlias = undefined;
    this.userAlias = newAlias;
  }

  public equals(other: SourceTableInstance): boolean {
    return this.alias == other.alias;
  }
}
