declare global {
  namespace NodeJS {
    // typescript autocomplete for environment variabless
    interface ProcessEnv {
      // must be set by user
      DB_PASSFILE?: string;
      // extracted from pgpassfile
      DB_HOST?: string;
      DB_PORT?: string;
      DB_DATABASE?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      DB_TYPE?: string;
    }
    interface Global {
      __coverage__?: any;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
