import { IColumnCombination, IColumnIdentifier } from "./IInclusionDependency";

// FDs as exported by HyFD
export interface IHyFD {
  type: "FunctionalDependency";
  determinant: IColumnCombination;
  dependant: IColumnIdentifier;
}

export default interface IFunctionalDependency {
  lhsColumns: Array<string>;
  rhsColumns: Array<string>;
}
