import IRequestBodyFDViolatingRows from "@/definitions/IRequestBodyFDViolatingRows";
import { Request, Response } from "express";
import { sqlUtils } from "../../db";

export default async function getViolatingRows(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const body: IRequestBodyFDViolatingRows =
      req.body as IRequestBodyFDViolatingRows;

    const result = await sqlUtils.getViolatingRowsForFDCount(
      body.schema,
      body.table,
      body.lhs,
      body.rhs
    );
    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res.status(502).json({
        error: "Could not get row count for functional dependency... ",
      });
  }
}
