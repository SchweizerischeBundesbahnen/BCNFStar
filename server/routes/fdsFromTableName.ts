import IFunctionalDependencies from "@/definitions/IFunctionalDependencies";
import { table } from "console";
import { Request, Response, RequestHandler } from "express";
import {readFileSync} from 'fs';
import MetanomeAlgorithm from "./metanomeAlgorithm";

export default function getFDsFromTableNameFunction(): RequestHandler {
    async function getFDsFromTableName(req: Request, res: Response): Promise<void> {
        try {
            const tableName = req.params.name;
            const algorithm = new MetanomeAlgorithm([tableName]);

            const metanomeOutputPaths = await algorithm.run();
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const fds = readFileSync(metanomeOutputPaths[tableName.split('.')[1]], 'utf8').toString().trim().split(/\r?\n/);
                          
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