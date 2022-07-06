import IPrimaryKey from "./IPrimaryKey";

export interface IRequestBodyUnionedKeys {
  table1Sql: string;
  table2Sql: string;
  key1: IPrimaryKey;
  key2: IPrimaryKey;
  unionedColumns: Array<Array<string>>;
}

export enum KeyUnionability {
  allowed = "allowed",
  forbidden = "forbidden",
}
