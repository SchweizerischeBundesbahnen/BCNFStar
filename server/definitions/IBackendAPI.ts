import IRelationship from "./IRelationship";
import IAttribute from "./IAttribute";

export interface IRequestBodyDataTransferSql {
  attributes: IAttribute[];
  newSchema: string;
  newTable: string;
  sourceTables: string[];
  relationships: IRelationship[];
}

export interface IRequestBodyCreateTableSql {
  newSchema: string;
  newTable: string;
  attributes: IAttribute[];
  primaryKey: string[];
}

export interface IRequestBodyINDViolatingRows {
  relationship: IRelationship;
  offset: number;
  limit: number;
}

export interface IRequestBodyForeignKeySql {
  name: string;
  relationship: IRelationship;
}
