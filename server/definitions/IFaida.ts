import { IMetanomeConfig } from "./IMetanomeConfig";

export const faidaAlgorithmName = "de.hpi.mpss2015n.approxind.FAIDA";

export interface IFaidaConfig extends IMetanomeConfig {
  IGNORE_CONSTANT: boolean; //=true
  VIRTUAL_COLUMN_STORE: boolean; //=false
  HLL_REL_STD_DEV: number; //=0.01
  APPROXIMATE_TESTER: string; //=HLL
  REUSE_COLUMN_STORE: boolean; //=false
  SAMPLE_GOAL: number; //=500
  IGNORE_NULL: boolean; //=true
  APPROXIMATE_TESTER_BYTES: number; //=32768
  DETECT_NARY: boolean; //=true
}

export const defaultFaidaConfig: IFaidaConfig = {
  IGNORE_CONSTANT: true,
  VIRTUAL_COLUMN_STORE: false,
  HLL_REL_STD_DEV: 0.01,
  APPROXIMATE_TESTER: "HLL",
  REUSE_COLUMN_STORE: false,
  SAMPLE_GOAL: 500,
  IGNORE_NULL: true,
  APPROXIMATE_TESTER_BYTES: 32768,
  DETECT_NARY: true,
  memory: "",
};
