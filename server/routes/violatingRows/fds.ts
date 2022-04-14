import { IRequestBodyFDViolatingRows } from "@/definitions/IBackendAPI";
import { Request, Response } from "express";
import { sqlUtils } from "../../db";

export default async function getViolatingRows(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // if(typeof(req.body) != IRequestBodyFDViolatingRows){
    //   res.status(400).json({error : "Wrong API Arguments"});
    //   return;
    // }

    const body: IRequestBodyFDViolatingRows =
      req.body as IRequestBodyFDViolatingRows;

    const result = await sqlUtils.getViolatingRowsForFD(
      body.schema,
      body.table,
      body.lhs,
      body.rhs
    );
    res.status(200).json(result);
    // const executeAndSend = async () => {
    //   await normi.execute(req.query as MetanomeConfig);
    //   res.json(await normi.getResults());
    // };
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res
        .status(502)
        .json({
          error: "Could not get violating rows for functional dependency... ",
        });
  }
}
