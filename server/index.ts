import express from "express";
import expressStaticGzip from "express-static-gzip";
import getTablesFunction from "./routes/tables";
import { getTableRowCounts } from "./routes/rowCounts";
import { getStaticDir } from "./utils/files";
import morgan from "morgan";
import cors, { CorsOptions } from "cors";
import getFksFunction from "./routes/fks";
import getPksFunction from "./routes/pks";

import testTypeCasting from "./routes/unionability/checkTypeConversion";
import checkUnionedKeys from "./routes/unionability/checkUniqueConstraint";

import { getTablePage } from "./routes/tablePage";
import { check, body } from "express-validator";
import {
  isValidFileName,
  isValidDatatype,
  isValidSql,
} from "./validation/parameterValidation";

import { getDbmsName } from "./routes/dbserver";

import createQueueMonitor from "./queueMonitor";
import getViolatingRowsForFD from "./routes/violatingRows/fds";
import getViolatingRowsForFDCount from "./routes/violatingRows/fdRowCounts";
import getViolatingRowsForSuggestedIND from "./routes/violatingRows/inds";
import getViolatingRowsForSuggestedINDCount from "./routes/violatingRows/indsRowCounts";
import bodyParser from "body-parser";

import {
  deleteMetanomeResults,
  getMetanomeIndex,
  getMetanomeResults,
} from "./routes/metanomeResults/";
import { runMetanome } from "./routes/metanomeResults/run";
import getRedundanceSum from "./routes/rankingRedundanceSum";
import getRedudanceGroupLength from "./routes/rankingRedudanceGroupLength";
import getMaxValue from "./routes/maxValue";
import getColumnSample from "./routes/columnSample";
import getSchemaMatching from "./routes/schemaMatching";

const app = express();

app.use(bodyParser.json({ strict: true }));
app.use((error, request, response, next) => {
  if (error !== null) {
    return response
      .status(400)
      .json({ errors: "The request body does not contain valid JSON" });
  }
  return next();
});
app.use(express.json());
app.use(cors());
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

app.get(
  "/redundances",
  [check("tableName").isString(), check("columns").isString()],
  getRedundanceSum
);
app.get(
  "/redundances/length",
  [check("tableName").isString(), check("columns").isString()],
  getRedudanceGroupLength
);
app.get(
  "/maxValue/column",
  [check("tableName").isString(), check("columnName").isString()],
  getMaxValue
);

app.get(
  "/samples",
  [check("tableName").isString(), check("columnName").isString()],
  getColumnSample
);

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

app.post("/schemaMatching", getSchemaMatching);

app.get("/persist/dbmsname", getDbmsName);

app.post(
  "/typecasting",
  [
    body("currentDatatype").trim().custom(isValidDatatype()),
    body("targetDatatype").trim().custom(isValidDatatype()),
  ],
  testTypeCasting
);

app.post("/unionedkeys", checkUnionedKeys);

app.post(
  "/violatingRows/fd",
  [body("sql").trim().custom(isValidSql())],
  getViolatingRowsForFD
);
app.post(
  "/violatingRows/rowcount/fd",
  [body("sql").trim().custom(isValidSql())],
  getViolatingRowsForFDCount
);

app.post(
  "/violatingRows/rowcount/ind",
  [
    body("referencingTableSql").trim().custom(isValidSql()),
    body("referencedTableSql").trim().custom(isValidSql()),
  ],
  getViolatingRowsForSuggestedINDCount
);
app.post(
  "/violatingRows/ind",
  [
    body("referencingTableSql").trim().custom(isValidSql()),
    body("referencedTableSql").trim().custom(isValidSql()),
  ],
  getViolatingRowsForSuggestedIND
);

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
