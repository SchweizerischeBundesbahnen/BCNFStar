declare global {
  namespace NodeJS {
    // typescript autocomplete for environment variabless
    interface ProcessEnv {
      // must be set by user
      PGPASSFILE?: string;
      // extracted from pgpassfile
      PGHOST?: string;
      PGPORT?: string;
      PGDATABASE?: string;
      PGUSER?: string;
      PGPASSWORD?: string;
      DB_TYPE?: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
