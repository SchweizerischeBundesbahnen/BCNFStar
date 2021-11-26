import MetanomeAlgorithm from './metanomeAlgorithm';
import { pkgJsonDir } from '../utils/files';
import {join, dirname} from "path";

const util = require('util');
const exec = util.promisify(require('child_process').exec);

export const METANOME_CLI_JAR_PATH = "metanome/metanome-cli-1.1.0.jar";
export const POSTGRES_JDBC_JAR_PATH = "metanome/postgresql-42.2.24.jre7.jar";

async function ls() {
  let metaAlgo = new MetanomeAlgorithm([]);
  // console.log(metaAlgo.command());
  const { stdout, stderr } = await exec(metaAlgo.command());
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}
ls();