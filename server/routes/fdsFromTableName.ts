import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { table } from "console";
import { Request, Response, RequestHandler } from "express";
import {readFileSync} from 'fs';
import MetanomeAlgorithm from "./metanomeAlgorithm";

export default function getFDsFromTableNameFunction(): RequestHandler {
    async function getFDsFromTableName(req: Request, res: Response): Promise<void> {
        try {
            console.log("getFDsFromTableName", req.params.tableName);
            
            const tableName = req.params.tableName;
            const metanomeOutputPaths = new MetanomeAlgorithm([tableName]).run();
            
            const fds = readFileSync(metanomeOutputPaths[tableName], 'utf8').toString().trim().split('\n');
                          
            const result: IFunctionalDependencies = {tableName: tableName, functionalDependencies: fds}; 
            res.json(result);
        } catch(error) {
            console.error(error);
            res.json({error: "Could not get fds for table... "});
            res.status(502);
        }
    }
    return getFDsFromTableName;
}