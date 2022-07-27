export default abstract class BasicTable {
  public name = '';
  public schemaName = '';

  public isSuggestedFact = false;
  public isRejectedFact = false;

  /**
   * returns the name of the table in the format "{schemaName}.{tableName}"
   */
  public get fullName(): string {
    return this.schemaName + '.' + this.name;
  }
}
