export type MetanomeConfig = Record<string, string | number | boolean>;

export interface IMetanomeJob {
  schemaAndTables: string[];
  algoClass: string;
  config: MetanomeConfig;
}
