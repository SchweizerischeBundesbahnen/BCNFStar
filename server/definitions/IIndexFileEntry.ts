import { IMetanomeConfig } from "./IMetanomeConfig";
import { IMetanomeJob   } from "./IMetanomeJob";


export type MetanomeResultType =
  "InclusionDependency" | "FunctionalDependency";


export interface IIndexFileEntry  extends IMetanomeJob {
  dbmsName: string;
  database: string;
  resultType: MetanomeResultType;
  fileName: string;
  createDate: number;
}
