export type MetanomeConfig = Record<string, string | number | boolean>;

export interface IIndexFileEntry {
  tables: string[];
  algorithm: string;
  fileName: string;
  config: MetanomeConfig;
  createDate: string;
}
