import express from "express";
import expressStaticGzip from "express-static-gzip";
import { join } from "path";
import { Pool } from "pg";
import getTablesFunction from "./routes/tables";
import getTableHeadFromNameFunction from "./routes/tableHeadFromName";
import morgan from "morgan";
import cors, { CorsOptions } from "cors";

const port = process.env["PORT"] || 80;

const pool = new Pool({database: "tpc_data", host: "localhost", user: "mafi"});

const whitelist = [
  "http://localhost",
  "http://localhost:4200",
];

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
  credentials: true
};

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors(corsOptions));

// Beispiel: Gebe beim Aufrufen von /test eine Antwort zurück
app.get("/test", (req, res) => {
  res.json({ key: "value" });
});

app.get("/tables", getTablesFunction(pool));
app.get("/tables/:name/head", getTableHeadFromNameFunction(pool));

app.use(
  expressStaticGzip(join(__dirname, "..", "frontend", "dist", "bcnfstar"), {})
);

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
