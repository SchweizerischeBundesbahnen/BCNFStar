import IRelationship from "./IRelationship";

export default interface IRequestBodyINDViolatingRows {
  referencingTableSql: string;
  referencedTableSql: string;
  relationship: IRelationship;
  offset: number;
  limit: number;
}
