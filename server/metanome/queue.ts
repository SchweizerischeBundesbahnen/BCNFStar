// if UnrecoverableError is not found, make sure to run npm install
import { Queue, QueueEvents, UnrecoverableError, Worker, Job } from "bullmq";
import { exec } from "child_process";
import { join } from "path";
import { rm } from "fs/promises";

import { absoluteServerDir } from "@/utils/files";
import { IMetanomeJob } from "@/definitions/IMetanomeJob";
import MetanomeAlgorithm from "./metanomeAlgorithm";
import BINDER from "./BINDER";
import HyFD from "./HyFD";
import FAIDA from "./FAIDA";
import RustFD from "./RustFD";

const queueName = "metanome";
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: +process.env.REDIS_PORT || 6379,
};

export const metanomeQueue = new Queue<IMetanomeJob, string, string>(
  queueName,
  {
    connection,
    defaultJobOptions: {
      attempts: 1,
      backoff: {
        type: "exponential",
        delay: 10_000,
      },
    },
  }
);

// uncommenting the next line will cause failed metanome jobs to be re-run
// const queueScheduler = new QueueScheduler(queueName, { connection });

/**
 *
 * @param command Command to be executed in a terminal. Must be platform-agnostic
 * @param job current job, used for logging
 * @returns a promise that resolves when the command terminates
 * @throws UnrecoverableErrors if the command failed, since
 */
function executeCommand(
  command: string,
  job: Job<IMetanomeJob, string>
): Promise<void> {
  return new Promise((resolve, reject) => {
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
function getAlgoInstance(data: IMetanomeJob): MetanomeAlgorithm {
  const singleFileAlgos = [HyFD, RustFD];
  const multiFileAlgos = [FAIDA, BINDER];
  for (const singleFileAlgo of singleFileAlgos) {
    const algo = new singleFileAlgo(data.schemaAndTables[0], data.config);
    if (data.algoClass == algo.algoClass()) return algo;
  }
  for (const multiFileAlgo of multiFileAlgos) {
    const algo = new multiFileAlgo(data.schemaAndTables, data.config);
    if (data.algoClass == algo.algoClass()) return algo;
  }
  throw Error(`Unknown algorithm: ${data.algoClass}`);
}

/**
 * Deletes all output folders of metanome.
 * Since we move the relevant outputs, this is safe.
 * Outputs of previous metanome runs may cause issues while executing metanme.
 * @returns a promise that resolves once all folders are deleted
 */
async function emptyMetanomeDirs(): Promise<any> {
  const metanomeFolder = join(absoluteServerDir, "metanome");
  const folders = ["results", "temp", "BINDER_temp"];
  return Promise.all(
    folders.map((f) =>
      rm(join(metanomeFolder, f), { recursive: true, force: true })
    )
  );
}

export const queueEvents = new QueueEvents(queueName, { connection });
// types: <type of job.data, type of returnValue>
const worker = new Worker<IMetanomeJob, string>(
  queueName,
  async (job) => {
    let start: number;
    const algo = getAlgoInstance(job.data);
    if (job.progress < 85) {
      job.log("Running metanome... ");
      start = Date.now();
      await emptyMetanomeDirs();
      await executeCommand(algo.command(), job);
      job.updateProgress(85);
      job.log(`Done after ${Date.now() - start} ms`);
    }
    if (job.progress < 90) {
      start = Date.now();

      job.log("Writing metadata file...");
      await algo.addToIndexFile();
      job.updateProgress(90);
      job.log(`Done after ${Date.now() - start} ms`);
    }
    if (job.progress < 95) {
      start = Date.now();
      job.log("Moving metanome result files...");
      await algo.moveFiles();
      job.updateProgress(95);
      job.log(`Done after ${Date.now() - start} ms`);
    }
    if (job.progress < 100) {
      start = Date.now();
      job.log("Processing metanome result files...");
      await algo.processFiles();
      job.updateProgress(100);
      job.log(`Done after ${Date.now() - start} ms`);
    }
    const path = await algo.resultPath();
    return path;
  },
  { connection, lockDuration: 10 * 60 * 1000 }
);

worker.on("error", (err) => {
  // log the error
  console.error(err);
});
