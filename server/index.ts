import express from "express";
import expressStaticGzip from "express-static-gzip";
import getTablesFunction from "./routes/tables";
import { getTableRowCounts } from "./routes/rowCounts";
import { getStaticDir } from "./utils/files";
import morgan from "morgan";
import cors, { CorsOptions } from "cors";
import getFksFunction from "./routes/fks";
import getPksFunction from "./routes/pks";

import testTypeCasting from "./routes/checkTypeConversion";

import { getTablePage } from "./routes/tablePage";
import { check } from "express-validator";
import isValidFileName from "./routes/validation/parameterValidation";

import { getDbmsName } from "./routes/dbserver";

import createQueueMonitor from "./queueMonitor";
import getViolatingRowsForFD from "./routes/violatingRows/fds";
import getViolatingRowsForFDCount from "./routes/violatingRows/fdRowCounts";
import getViolatingRowsForSuggestedIND from "./routes/violatingRows/inds";
import getViolatingRowsForSuggestedINDCount from "./routes/violatingRows/indsRowCounts";

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
app.get(
  "/tables/page",
  [check("limit").isNumeric(), check("offset").isNumeric()],
  getTablePage
);

app.get("/fks", getFksFunction);
app.get("/pks", getPksFunction);

// Metanome
app.get("/metanomeResults", getMetanomeIndex);
app.get(
  "/metanomeResults/:fileName",
  [check("fileName").custom(isValidFileName())],
  getMetanomeResults
);
app.delete(
  "/metanomeResults/:fileName",
  [check("fileName").custom(isValidFileName())],
  deleteMetanomeResults
);
app.post("/metanomeResults", runMetanome);

app.get("/persist/dbmsname", getDbmsName);

app.post("/typecasting", testTypeCasting);

app.post("/violatingRows/fd", getViolatingRowsForFD);
app.post("/violatingRows/rowcount/fd", getViolatingRowsForFDCount);

app.post("/violatingRows/rowcount/ind", getViolatingRowsForSuggestedINDCount);
app.post("/violatingRows/ind", getViolatingRowsForSuggestedIND);

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
