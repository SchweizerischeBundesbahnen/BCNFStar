import IPrimaryKey from "./IPrimaryKey";

export interface IRequestBodyUnionedKeys {
  tableSql: string;
  expectedKey: IPrimaryKey;
}

export enum KeyUnionability {
  allowed = "allowed",
  forbidden = "forbidden",
}
