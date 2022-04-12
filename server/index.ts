import express from "express";
import expressStaticGzip from "express-static-gzip";
// import postCreateTable from "./routes/persist_schema/createTable";
import getTablesFunction from "./routes/tables";
import { getTableRowCounts } from "./routes/rowCounts";
import { getStaticDir } from "./utils/files";
import morgan from "morgan";
import getCreateForeignKeySQL from "./routes/persist_schema/createForeignKey";
import cors, { CorsOptions } from "cors";
import getFksFunction from "./routes/fks";
import getPksFunction from "./routes/pks";
import getCreateTableSQL from "./routes/persist_schema/createTable";
import getSchemaPreparationSQL from "./routes/persist_schema/prepareSchema";
import getDataTransferSQL from "./routes/persist_schema/transferData";
import getAddPrimaryKeySQL from "./routes/persist_schema/createPrimaryKey";
import { getTableHead } from "./routes/tableHeads";
import createQueueMonitor from "./queueMonitor";
import {
  deleteMetanomeResults,
  getMetanomeIndex,
  getMetanomeResults,
} from "./routes/metanomeResults/";
import { runMetanome } from "./routes/metanomeResults/run";

const whitelist = ["http://localhost", "http://localhost:4200"];

const corsOptions: CorsOptions = {
  origin(
    origin: string | undefined,
    callback: (a: Error | null, b: boolean) => void
  ) {
    callback(null, true);
  },
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));
app.use(
  morgan(
    "dev",
    // omit queue/api calls from log, since they appear very frequent
    { skip: (req, res) => req.originalUrl.includes("/queue/api") }
  )
);
if (global.__coverage__) {
  console.log("enabling code coverage reporting");
  require("@cypress/code-coverage/middleware/express")(app);
}

createQueueMonitor(app);

app.get("/tables", getTablesFunction);
app.get("/tables/rows", getTableRowCounts);
app.get("/tables/heads", getTableHead);
app.get("/fks", getFksFunction);
app.get("/pks", getPksFunction);

// Metanome
app.get("/metanomeResults", getMetanomeIndex);
app.get("/metanomeResults/:fileName", getMetanomeResults);
app.delete("/metanomeResults/:fileName", deleteMetanomeResults);
app.post("/metanomeResults", runMetanome);

app.post("/persist/createTable", getCreateTableSQL());
app.post("/persist/createForeignKey", getCreateForeignKeySQL());
app.post("/persist/schemaPreparation", getSchemaPreparationSQL());
app.post("/persist/dataTransfer", getDataTransferSQL());
app.post("/persist/createPrimaryKey", getAddPrimaryKeySQL());

app.use(expressStaticGzip(getStaticDir(), { serveStatic: {} }));

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
