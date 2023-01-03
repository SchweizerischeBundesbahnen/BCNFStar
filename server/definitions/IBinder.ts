import { IMetanomeConfig } from "./IMetanomeConfig";

export const binderAlgorithmName = "de.metanome.algorithms.binder.BINDERFile";

export interface IBinderConfig extends IMetanomeConfig {
  // whether to detect nary inds at all
  // should be set automatically
  // DETECT_NARY?: boolean; //=false
  // how many columns an  IND might reference
  MAX_NARY_LEVEL: number; //=-1
  CLEAN_TEMP: boolean; //=true
  INPUT_ROW_LIMIT: number; //=-1
  FILTER_KEY_FOREIGNKEYS: boolean; //false
  MAX_MEMORY_USAGE_PERCENTAGE: number; //=60
  TEMP_FOLDER_PATH: string; //= 'BINDER_temp'
  NUM_BUCKETS_PER_COLUMN: number; //= 10
  MEMORY_CHECK_FREQUENCY: number; //= 100
}

export const defaultBinderConfig: IBinderConfig = {
  MAX_NARY_LEVEL: 2,
  CLEAN_TEMP: true,
  INPUT_ROW_LIMIT: -1,
  FILTER_KEY_FOREIGNKEYS: false,
  MAX_MEMORY_USAGE_PERCENTAGE: 60,
  TEMP_FOLDER_PATH: "BINDER_temp",
  NUM_BUCKETS_PER_COLUMN: 10,
  MEMORY_CHECK_FREQUENCY: 100,
  memory: "",
};
