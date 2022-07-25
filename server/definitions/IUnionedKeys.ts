import IPrimaryKey from "./IPrimaryKey";

export interface IRequestBodyUnionedKeys {
  tableSql: string;
  key: Array<string>;
}

export enum KeyUnionability {
  allowed = "allowed",
  forbidden = "forbidden",
}
