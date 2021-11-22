import express from "express";
import expressStaticGzip from "express-static-gzip";
import { join } from "path";

const port = process.env["PORT"] || 80;

const app = express();
app.use(express.json());

// Beispiel: Gebe beim Aufrufen von /test eine Antwort zurück
app.get("/test", (req, res) => {
  res.json({key: 'value'})
});

app.use(expressStaticGzip(join(__dirname,'..','frontend','dist','bcnfstar'), {}));

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
