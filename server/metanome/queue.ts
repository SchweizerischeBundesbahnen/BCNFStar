import { Queue, QueueEvents } from "bullmq";
import { Worker } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
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
    const asyncExec = promisify(exec);
    let { stderr, stdout } = await asyncExec(job.data, {
      cwd: absoluteServerDir + "/metanome",
    });
    if (stderr) {
      job.log("Stderr");
      job.log(stderr);
      job.log("Stdout:");
      job.log(stdout);
      console.error(stderr);
      throw Error("Metanome execution failed");
    } else {
      job.log("Stderr: <empty>, Stdout:");
      job.log(stdout);
    }
  },
  { connection }
);

worker.on("error", (err) => {
  // log the error
  console.error(err);
});
