export interface IRequestBodyTypeCasting {
  schema: string;
  table: string;
  column: string;
  currentDatatype: string;
  targetDatatype: string;
}

export enum TypeCasting {
  informationloss = "informationloss",
  allowed = "allowed",
  forbidden = "forbidden",
}
