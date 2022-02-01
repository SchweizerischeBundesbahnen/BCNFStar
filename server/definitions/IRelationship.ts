import ITable from "./ITable";

export default interface IRelationship {
  referencing: ITable;
  referenced: ITable;
  columnRelationships: IColumnRelationship[];
}

export interface IColumnRelationship {
  referencingColumn: string;
  referencedColumn: string;
}
