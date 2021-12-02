import IAttribute from "./IAttribute";

export default interface ITableHead {
  attributes: string[];
  rows: Record<string, any>[];
}
