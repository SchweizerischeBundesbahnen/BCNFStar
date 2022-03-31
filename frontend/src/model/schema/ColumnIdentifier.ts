import TableIdentifier from './TableIdentifier';

export default class ColumnIdentifier {
  public name: string;
  public table: TableIdentifier;

  public constructor(name: string, tableIdentifier: TableIdentifier) {
    this.name = name;
    this.table = tableIdentifier;
  }
}
