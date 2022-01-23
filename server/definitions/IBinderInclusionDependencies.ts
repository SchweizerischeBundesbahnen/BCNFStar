export interface ColumnIdentifier {
  tableIdentifier: string;
  columnIdentifier: string;
  schemaIdentifier?: string;
}

export interface Dependant {
  columnIdentifiers: ColumnIdentifier[];
}

export interface Referenced {
  columnIdentifiers: ColumnIdentifier[];
}

export default interface BinderInclusionDependency {
  type: string;
  dependant: Dependant;
  referenced: Referenced;
}
