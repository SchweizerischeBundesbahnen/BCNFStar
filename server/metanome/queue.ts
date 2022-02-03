import { Queue, QueueEvents } from "bullmq";
import { Worker } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
import { absoluteServerDir } from "../utils/files";

const queueName = "metanome";

export const metanomeQueue = new Queue(queueName, {
  connection: process.env.REDIS_URL,
});

export const queueEvents = new QueueEvents(queueName, { connection: {} });

const worker = new Worker<string, void, string>(
  queueName,
  async (job) => {
    const asyncExec = promisify(exec);
    let result = await asyncExec(job.data, {
      cwd: absoluteServerDir + "/metanome",
    });
    job.log(JSON.stringify(result));
    if (result.stderr) {
      console.error(result.stderr);
      throw Error("Metanome execution failed");
    }
  },
  { connection: {} }
);

worker.on("error", (err) => {
  // log the error
  console.error(err);
});
