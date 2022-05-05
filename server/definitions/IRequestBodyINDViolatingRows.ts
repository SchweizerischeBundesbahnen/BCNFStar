import IRelationship from "./IRelationship";

export default interface IRequestBodyINDViolatingRows {
  relationship: IRelationship;
  offset: number;
  limit: number;
}
