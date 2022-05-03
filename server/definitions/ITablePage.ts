import IAttribute from "./IAttribute";

export default interface ITablePage {
  attributes: string[];
  rows: Record<string, any>[];
}
