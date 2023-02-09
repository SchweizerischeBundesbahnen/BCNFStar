import { IColumnCombination, IColumnIdentifier } from "./IInclusionDependency";
import { IMetanomeConfig } from "./IMetanomeConfig";

export const rustAlgorithmName =
  "de.metanome.algorithms.rustfd_extended.RustFDExtended";

export interface IRustFdConfig extends IMetanomeConfig {
}

export const defaultRustFdConfig: IRustFdConfig = {

  memory: "",
};

