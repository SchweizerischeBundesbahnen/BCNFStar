import { config } from "dotenv";
import { readFileSync } from "fs";

export function setupDBCredentials() {
  try {
    config({ path: "../.env.local" });
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
      `);
      process.exit();
    } else throw e;
  }
}
