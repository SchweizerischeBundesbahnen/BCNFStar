import IAttribute from "./IAttribute";

export default interface ITable {
  name: string;
  schemaName: string;
  attribute: IAttribute[];
}
