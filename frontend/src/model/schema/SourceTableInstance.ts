import SourceTable from './SourceTable';

/** Represents a unique instance of a sourceTable inside a table. Also often referred to as "source". */
export default class SourceTableInstance {
  /** Number to append to the baseAlias to enforce that the aliases of sources are unique in one table. */
  public id = 1;
  /** Returns whether the id is needed to enforce unique source names. */
  public useId = false;
  /** The alias that the user manually gave to this source. */
  public userAlias?: string;

  constructor(public table: SourceTable, userAlias?: string) {
    this.setUserAlias(userAlias);
  }

  public get baseAlias(): string {
    return this.userAlias ?? this.defaultName;
  }

  /** An alias for the source. It is unique in one table. */
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
    else this.userAlias = newAlias;
  }

  public equals(other: SourceTableInstance): boolean {
    if (this === other) return true;
    return this.alias == other.alias;
  }
}
