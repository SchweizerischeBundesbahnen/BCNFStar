import ColumnIdentifiers from "./IColumnIdentifiers";

export default interface IInd {
  type: string;
  dependant: ColumnIdentifiers;
  referenced: ColumnIdentifiers;
}
