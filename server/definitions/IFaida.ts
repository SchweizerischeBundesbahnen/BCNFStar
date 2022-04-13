export interface IFaidaConfig {
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
