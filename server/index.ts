import express from "express";
import expressStaticGzip from "express-static-gzip";
import { join } from "path";
import { Pool } from "pg";
import { setupDBCredentials } from "./setupDbCredentials";
import postCreateTable from "./routes/persist_schema/createTable";
import getTablesFunction from "./routes/tables";
import getTableHeadFromNameFunction from "./routes/tableHeadFromName";
import getFDsFromTableNameFunction from "./routes/fdsFromTableName";
import postRunMetanomeFDAlgorithmFunction from "./routes/runMetanome";
import { absoluteServerDir } from "./utils/files";
import morgan from "morgan";
import MsSqlUtils from "./mssql";
import postCreateForeignKey from "./routes/persist_schema/createForeignKey";
import cors, { CorsOptions } from "cors";

setupDBCredentials();

const pool = new Pool();
const mssqlPool = new MsSqlUtils(
  process.env.PGHOST,
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  +process.env.PGPORT
);
mssqlPool.init().then(() => {});

const whitelist = ["http://localhost", "http://localhost:4200"];

const corsOptions: CorsOptions = {
  origin(
    origin: string | undefined,
    callback: (a: Error | null, b: boolean) => void
  ) {
    // callback(null, true);
    // return;
    if (process.execArgv.length || !origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Error! This origin is not allowed " + origin);
      callback(new Error("Error! CORS not allowed"), false);
    }
  },
  credentials: true,
};

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors(corsOptions));

// Beispiel: Gebe beim Aufrufen von /test eine Antwort zurück
app.get("/test", (req, res) => {
  res.json({ key: "value" });
});

app.get("/tables", getTablesFunction(mssqlPool));
app.get("/tables/head", getTableHeadFromNameFunction(mssqlPool));
app.get("/tables/:name/fds", getFDsFromTableNameFunction());

app.post("/persist/createTable", postCreateTable(pool));
app.post("/persist/createForeignKey", postCreateForeignKey(pool));
// PGPASSFILE=C:\.pgpass
// localhost:80/tables/public.customer/fds
app.post("/tables/:name/fds/run", postRunMetanomeFDAlgorithmFunction());

app.use(
  expressStaticGzip(
    join(absoluteServerDir, "..", "frontend", "dist", "bcnfstar"),
    {}
  )
);

const port = process.env["PORT"] || 80;

const server = app.listen(port, () => {
  console.log(`bcnfstar server started on port ${port}`);

  function exitHandler(options: any, exitCode: string) {
    console.log("ending");
    console.log(options);
    server.close();
    process.exit();
  }
  // catches ctrl+c event
  process.on("SIGINT", exitHandler.bind(null, { exit: true }));

  // catches "kill pid" (for example: nodemon restart)
  process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
  process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
});
