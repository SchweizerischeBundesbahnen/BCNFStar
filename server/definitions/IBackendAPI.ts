import IRelationship from "./IRelationship";
import IAttribute from "./IAttribute";

export interface IRequestBodyDataTransferSql {
  attributes: IAttribute[];
  newSchema: string;
  newTable: string;
  sourceTables: string[];
  relationships: IRelationship[];
}

export interface IRequestBodyForeignKeySql {
  name: string;
  relationship: IRelationship;
}
