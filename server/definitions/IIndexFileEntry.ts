import { IMetanomeConfig } from "./IMetanomeConfig";

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
  config: IMetanomeConfig;
  createDate: number;
}
