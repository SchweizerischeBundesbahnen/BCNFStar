import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { absoluteServerDir } from "./utils/files";

export function setupDBCredentials() {
  try {
    config({ path: join(absoluteServerDir, "..", ".env.local") });
    if (!process.env.PGPASSFILE)
      process.env.PGPASSFILE = getDefaultPgpassLocation();

    // replace ~ with full home directory, as fs doesn't understand it
    if (process.env.PGPASSFILE.startsWith("~"))
      process.env.PGPASSFILE =
        process.env.HOME + process.env.PGPASSFILE.slice(1);
    // .pgpass format: hostname:port:database:username:password
    const content = readFileSync(process.env.PGPASSFILE, "utf-8");
    const [hostname, port, database, username, password] = content.split(":");

    process.env.PGHOST = hostname;
    process.env.PGPORT = port;
    process.env.PGDATABASE = database;
    process.env.PGUSER = username;
    process.env.PGPASSWORD = password;
  } catch (e) {
    if (e.message.includes("ENOENT")) {
      console.error(`Your database settings seem to be invalid. Create a pgpass file 
(for more info, see https://www.postgresql.org/docs/9.3/libpq-pgpass.html)
and save its location in a PGPASSFILE environment variable. You can do this by placing 
the line 'PGPASSFILE=<path to file>' in a file called .env.local at the project root.
The current value of PGPASSFILE is ${process.env.PGPASSFILE}`);
      process.exit();
    } else throw e;
  }
}

function getDefaultPgpassLocation(): string {
  if (process.platform == "win32")
    return join(process.env.APPDATA, "postgresql", "pgpass.conf");
  else return join(process.env.HOME, ".pgpass");
}
