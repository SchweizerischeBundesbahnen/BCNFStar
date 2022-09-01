/** Contains factors relevant for the determination of whether a foreign key relationship should be displayed. */
export interface FkDisplayOptions {
  /** Whether the foreign key is automatically filtered. */
  filtered: boolean;
  /** Whether the user manually dismissed the foreign key. */
  blacklisted: boolean;
  /** Whether the user explicitely wants the foreign key to be displayed. */
  whitelisted: boolean;
}
