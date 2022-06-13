import IRequestBodyFDViolatingRows from "@/definitions/IRequestBodyFDViolatingRows";
import { isIRequestBodyFDViolatingRows } from "@/definitions/IRequestBodyFDViolatingRows.guard";
import { Request, Response } from "express";
import { sqlUtils } from "../../db";

export default async function getViolatingRows(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isIRequestBodyFDViolatingRows(req.body)) {
      res.status(422).json({ errrors: "Invalid request body" });
      return;
    }

    const body: IRequestBodyFDViolatingRows =
      req.body as IRequestBodyFDViolatingRows;

    const result = await sqlUtils.getViolatingRowsForFD(
      body.schema,
      body.table,
      body.lhs,
      body.rhs,
      body.offset,
      body.limit
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res.status(502).json({
        error: "Could not get violating rows for functional dependency... ",
      });
  }
}
