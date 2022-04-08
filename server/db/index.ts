import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { absoluteServerDir, splitlines } from "../utils/files";
import MsSqlUtils from "./MsSqlUtils";
import PostgresSqlUtils from "./PostgresSqlUtils";
import SqlUtils from "./SqlUtils";

export function setupDBCredentials(): SqlUtils {
  try {
    config({ path: join(absoluteServerDir, "..", ".env.local") });
    if (!process.env.DB_PASSFILE)
      process.env.DB_PASSFILE = getDefaultPgpassLocation();

    // replace ~ with full home directory, as fs doesn't understand it
    if (process.env.DB_PASSFILE.startsWith("~"))
      process.env.DB_PASSFILE =
        process.env.HOME + process.env.DB_PASSFILE.slice(1);
    // .pgpass format: hostname:port:database:username:password
    const content = readFileSync(process.env.DB_PASSFILE, "utf-8");
    const [hostname, port, database, username, password] = content
      .split(":")
      .map((v) => splitlines(v)[0].trim());

    process.env.DB_HOST = hostname;
    process.env.DB_PORT = port;
    process.env.DB_DATABASE = database;
    process.env.DB_USER = username;
    process.env.DB_PASSWORD = password;
  } catch (e) {
    if (e.message.includes("ENOENT")) {
      console.error(`Your database settings seem to be invalid. Create a pgpass file 
(for more info, see https://www.postgresql.org/docs/9.3/libpq-pgpass.html)
and save its location in a DB_PASSFILE environment variable. You can do this by placing 
the line 'DB_PASSFILE=<path to file>' in a file called .env.local at the project root.
The current value of DB_PASSFILE is ${process.env.DB_PASSFILE}`);
      process.exit();
    } else throw e;
  }
  return createDbUtils();
}

function getDefaultPgpassLocation(): string {
  if (process.platform == "win32")
    return join(process.env.APPDATA, "postgresql", "pgpass.conf");
  else return join(process.env.HOME, ".pgpass");
}

function createDbUtils() {
  if (process.env.DB_TYPE == "mssql" || process.env.DB_TYPE == "sqlserver") {
    return new MsSqlUtils(
      process.env.DB_HOST,
      process.env.DB_DATABASE,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      +process.env.DB_PORT
    );
  } else if (process.env.DB_TYPE == "postgres") {
    return new PostgresSqlUtils(
      process.env.DB_HOST,
      process.env.DB_DATABASE,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      +process.env.DB_PORT
    );
  } else {
    throw Error(`Error: Unknown value for environment variable DB_TYPE: ${process.env.DB_TYPE}
Valid values are 'mssql', 'sqlserver', 'postgres'`);
  }
}

setupDBCredentials();
export const sqlUtils = createDbUtils();
sqlUtils.init();
