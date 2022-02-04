export interface IColumnIdentifier {
  tableIdentifier: string;
  columnIdentifier: string;
  schemaIdentifier?: string;
}

interface IDependant {
  columnIdentifiers: IColumnIdentifier[];
}

interface IReferenced {
  columnIdentifiers: IColumnIdentifier[];
}

export default interface IInclusionDependency {
  type: string;
  dependant: IDependant;
  referenced: IReferenced;
}
