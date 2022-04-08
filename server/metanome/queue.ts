// if UnrecoverableError is not found, make sure to run npm install
import {
  Queue,
  QueueEvents,
  UnrecoverableError,
  Worker,
  Job,
  QueueScheduler,
} from "bullmq";
import { exec } from "child_process";
import { absoluteServerDir } from "../utils/files";
import MetanomeAlgorithm, { MetanomeConfig } from "./metanomeAlgorithm";
import Normi from "./Normi";
import BINDER from "./BINDER";
import { rm } from "fs/promises";

const queueName = "metanome";
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
};

export interface JobData {
  schemaAndTables: string[];
  jobType: "ind" | "fd";
  config: MetanomeConfig;
}

export const metanomeQueue = new Queue<JobData, void, string>(queueName, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10_000,
    },
  },
});

// uncommenting the next line will cause failed metanome jobs to be re-run
const queueScheduler = new QueueScheduler(queueName, { connection });

/**
 *
 * @param command Command to be executed in a terminal. Must be platform-agnostic
 * @param job current job, used for logging
 * @returns a promise that resolves when the command terminates
 * @throws UnrecoverableErrors if the command failed, since
 */
function executeCommand(
  command: string,
  job: Job<JobData, void>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    job.log(`Executing command: "${command}"`);
    let process = exec(command, {
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
        reject(new UnrecoverableError(`Command exited with exit code ${code}`));
      } else resolve();
    });
  });
}

/**
 * @param data job data object
 * @returns instance of a metanome algorithm built from the job data
 */
function getAlgoInstance(data: JobData): MetanomeAlgorithm {
  if (data.jobType == "fd")
    return new Normi(data.schemaAndTables[0], data.config);
  else if (data.jobType == "ind")
    return new BINDER(data.schemaAndTables, data.config);
  else
    throw Error(
      `Unknown job type. Known ones are  'ind' or 'fd': ${data.jobType}`
    );
}

/**
 * Deletes all output folders of metanome.
 * Since we move the relevant outputs, this is safe.
 * Outputs of previous metanome runs may cause issues while executing metanme.
 * @returns a promise that resolves once all folders are deleted
 */
async function emptyMetanomeDirs(): Promise<any> {
  const folders = ["metanome/results", "metanome/temp", "metanome/BINDER_temp"];
  return Promise.all(
    folders.map((f) => rm(f, { recursive: true, force: true }))
  );
}

export const queueEvents = new QueueEvents(queueName, { connection });
// types: <type of job.data, type of returnValue>
const worker = new Worker<JobData, void>(
  queueName,
  async (job) => {
    const algo = getAlgoInstance(job.data);
    if (job.progress < 90) {
      job.log("Running metanome... ");
      await emptyMetanomeDirs();
      await executeCommand(algo.command(), job);
      job.updateProgress(90);
    }
    if (job.progress < 95) {
      job.log("Moving metanome result files...");
      await algo.moveFiles();
      job.updateProgress(95);
    }
    if (job.progress < 100) {
      job.log("Processing metanome result files...");
      await algo.processFiles();
      job.updateProgress(100);
    }
  },
  { connection }
);

worker.on("error", (err) => {
  // log the error
  console.error(err);
});
