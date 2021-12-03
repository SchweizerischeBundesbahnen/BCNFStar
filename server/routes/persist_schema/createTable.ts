import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler } from "express";
import { Pool } from "pg";
import { EOL } from "os";

export default function postCreateTable(
    pool: Pool
): RequestHandler {
    async function createTable(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const body = req.body;
            let schema = body.schema;
            const table = body.name;
            const attributes = body.attribute;

            
            const client = await pool.connect();

            schema = `ABC; DROP TABLE testschema.test;`;


            
            // parameter = "' DROP TABLE ... -- ";
/*
SELECT ..... 
FROM .... 
WHERE a = '${parameter}'

SELECT ..... 
FROM .... 
WHERE a = '' DROP TABLE ... -- '


*/
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
            // await client.query(`DROP TABLE IF EXISTS ${schema}.${table};`);
            // console.log(attributes.map(a => a.name + " " + a.dataType).join("," + EOL));
            // await client.query(`CREATE TABLE ${schema}.${table} (
            //     ${attributes.map(a => a.name + " " + a.dataType).join(",")}
            //     );`);
            console.log("schema: ", schema);
            console.log("table: ", table);
            console.log("attributes: ", attributes);
        } catch (error) {
            console.error(error);
            res.json({ error: "Could not get tables" });
            res.status(502);
        }
    }

    return createTable;
}
