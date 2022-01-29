import express from "express";
import expressStaticGzip from "express-static-gzip";
import { join } from "path";
// import postCreateTable from "./routes/persist_schema/createTable";
import getTablesFunction from "./routes/tables";
import getTableHeadFromNameFunction from "./routes/tableHeadFromName";
import getFDsFromTableNameFunction from "./routes/fdsFromTableName";
import getINDsForTablesFunction from "./routes/indsForTables";
import postRunMetanomeFDAlgorithmFunction from "./routes/runMetanomeFD";
import postRunMetanomeINDAlgorithmFunction from "./routes/runMetanomeIND";
import { absoluteServerDir } from "./utils/files";
import morgan from "morgan";
import getCreateForeignKeySQL from "./routes/persist_schema/createForeignKey";
import cors, { CorsOptions } from "cors";
import getFksFunction from "./routes/fks";
import getCreateTableSQL from "./routes/persist_schema/createTable";
import getSchemaPreparationSQL from "./routes/persist_schema/prepareSchema";
import getDataTransferSQL from "./routes/persist_schema/transferData";
import getAddPrimaryKeySQL from "./routes/persist_schema/createPrimaryKey";

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

app.get("/tables", getTablesFunction());
app.get("/tables/head", getTableHeadFromNameFunction());
app.get("/tables/:name/fds", getFDsFromTableNameFunction());
app.get("/fks", getFksFunction);

app.post("/persist/createTable", getCreateTableSQL());
app.post("/persist/createForeignKey", getCreateForeignKeySQL());
app.post("/persist/schemaPreparation", getSchemaPreparationSQL());
app.post("/persist/dataTransfer", getDataTransferSQL());
app.post("/persist/createPrimaryKey", getAddPrimaryKeySQL());

app.get("/tables/:tableNames/inds", getINDsForTablesFunction());

// app.post("/persist/createTable", postCreateTable(pool));
// app.post("/persist/createForeignKey", postCreateForeignKey(pool));
// DB_PASSFILE=C:\.pgpass
// localhost:80/tables/public.customer/fds
app.post("/tables/:name/fds/run", postRunMetanomeFDAlgorithmFunction());
app.post("/tables/inds/run", postRunMetanomeINDAlgorithmFunction());

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
