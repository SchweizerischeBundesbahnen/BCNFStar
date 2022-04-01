// if UnrecoverableError is not found, make sure to run npm install
import { Queue, QueueEvents, UnrecoverableError, Worker, Job } from "bullmq";
import { exec } from "child_process";
import { absoluteServerDir } from "../utils/files";
import MetanomeAlgorithm, { MetanomeConfig } from "./metanomeAlgorithm";
import Normi from "./Normi";
import BINDER from "./BINDER";

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
});

function executeCommand(command: string, job: Job<JobData, void>) {
  return new Promise<void>((resolve, reject) => {
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

// async function emptyMetanomeDirs() {
//   const [resultFiles, tempfiles, binderTemps] = await Promise.all([readdir('metanome/results'), readdir('metanome/temp'), readdir('metanome/BINDER_temp')])

//   console.log(resultFiles, tempfiles, binderTemps)
// }

export const queueEvents = new QueueEvents(queueName, { connection });
// types: <type of job.data, type of returnValue>
const worker = new Worker<JobData, void>(
  queueName,
  async (job) => {
    const algo = getAlgoInstance(job.data);
    if (job.progress < 90) {
      await executeCommand(algo.command(), job);
      job.progress = 90;
    }
    if (job.progress < 95) {
      await algo.moveFiles();
      job.progress = 95;
    }
    if (job.progress < 100) {
      await algo.processFiles();
      job.progress = 100;
    }
  },
  { connection }
);

worker.on("error", (err) => {
  // log the error
  console.error(err);
});

// emptyMetanomeDirs()
