import express from "express";
import expressStaticGzip from "express-static-gzip";
import { join } from "path";
import { Pool } from "pg";
import { setupDBCredentials } from "./setupDbCredentials";

import getTablesFunction from "./routes/tables";
import getTableHeadFromNameFunction from "./routes/tableHeadFromName";
import getFDsFromTableNameFunction from "./routes/fdsFromTableName";
import postRunMetanomeFDAlgorithmFunction from "./routes/runMetanome";
import morgan from "morgan";

setupDBCredentials();

const pool = new Pool({});

const app = express();
app.use(morgan("dev"));
app.use(express.json());

// Beispiel: Gebe beim Aufrufen von /test eine Antwort zurück
app.get("/test", (req, res) => {
  res.json({ key: "value" });
});

app.get("/tables", getTablesFunction(pool));
app.get("/tables/:name/head", getTableHeadFromNameFunction(pool));
app.get("/tables/:name/fds", getFDsFromTableNameFunction());

app.post("/tables/:name/fds/run", postRunMetanomeFDAlgorithmFunction());

app.use(
  expressStaticGzip(join(__dirname, "..", "frontend", "dist", "bcnfstar"), {})
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
