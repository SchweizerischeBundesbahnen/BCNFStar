export interface IColumnIdentifier {
  tableIdentifier: string;
  columnIdentifier: string;
  schemaIdentifier?: string;
}

interface IColumnCombination {
  columnIdentifiers: IColumnIdentifier[];
}

export default interface IInclusionDependency {
  type: string;
  dependant: IColumnCombination;
  referenced: IColumnCombination;
}
