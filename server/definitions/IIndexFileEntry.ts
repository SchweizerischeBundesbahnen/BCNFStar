import { MetanomeConfig } from "./IMetanomeJob";

export enum MetanomeResultType {
  ind = "InclusionDependency",
  fd = "FunctionalDependency",
}

export interface IIndexFileEntry {
  tables: string[];
  dbmsName: string;
  database: string;
  resultType: MetanomeResultType;
  algorithm: string;
  fileName: string;
  config: MetanomeConfig;
  createDate: number;
}
