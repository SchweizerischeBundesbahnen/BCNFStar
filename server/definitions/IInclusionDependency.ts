export interface IColumnIdentifier {
  tableIdentifier: string;
  columnIdentifier: string;
  schemaIdentifier?: string;
}

export interface IColumnCombination {
  columnIdentifiers: Array<IColumnIdentifier>;
}

export default interface IInclusionDependency {
  type: "InclusionDependency";
  dependant: IColumnCombination;
  referenced: IColumnCombination;
}
