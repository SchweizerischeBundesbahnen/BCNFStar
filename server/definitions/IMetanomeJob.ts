import { IMetanomeConfig } from "./IMetanomeConfig";

export interface IMetanomeJob {
  schemaAndTables: string[];
  algoClass: string;
  config: IMetanomeConfig;
}
