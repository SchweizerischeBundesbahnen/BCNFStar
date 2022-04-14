import { IColumnCombination, IColumnIdentifier } from "./IInclusionDependency";
import { IMetanomeConfig } from "./IMetanomeConfig";

export interface IHyFDConfig extends IMetanomeConfig {
  INPUT_ROW_LIMIT: number; //=-1
  // (assumption): checks if memory is nearly full, and writes to disk if so
  ENABLE_MEMORY_GUARDIAN: boolean; //=true
  NULL_EQUALS_NULL: boolean; //=true
  VALIDATE_PARALLEL: boolean; //=true
  MAX_DETERMINANT_SIZE: number; //=-1
}

// FDs as exported by HyFD
export interface IHyFD {
  type: "FunctionalDependency";
  determinant: IColumnCombination;
  dependant: IColumnIdentifier;
}
