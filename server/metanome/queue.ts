// if UnrecoverableError is not found, make sure to run npm install
import { Queue, QueueEvents, UnrecoverableError } from "bullmq";
import { Worker } from "bullmq";
import { exec } from "child_process";
import { absoluteServerDir } from "../utils/files";

const queueName = "metanome";
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
};

export const metanomeQueue = new Queue(queueName, { connection });

export const queueEvents = new QueueEvents(queueName, { connection });
// types: <type of job.data, type of returnValue>
const worker = new Worker<string, void>(
  queueName,
  async (job) => {
    return new Promise<void>((resolve, reject) => {
      let process = exec(job.data, {
        cwd: absoluteServerDir + "/metanome",
      });
      process.stdout.on("data", (chunk) => job.log(chunk));
      process.stderr.on("data", (chunk) => job.log(chunk));
      process.on("error", (err) => {
        job.log(`An error ocurred while executing metanome: ${err}`);
        reject(new UnrecoverableError(err.message));
      });
      process.on("close", (code) => {
        if (code) {
          job.log(`Error: Command exited with exit code ${code}`);
          reject(
            new UnrecoverableError(`Command exited with exit code ${code}`)
          );
        } else resolve();
      });
    });
  },
  { connection }
);

worker.on("error", (err) => {
  // log the error
  console.error(err);
});
