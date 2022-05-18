import { IColumnIdentifier } from "./IInclusionDependency";

export default interface IForeignKey {
  referencing: Array<IColumnIdentifier>;
  referenced: Array<IColumnIdentifier>;
}
