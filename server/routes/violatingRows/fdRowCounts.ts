import IRequestBodyFDViolatingRows from "@/definitions/IRequestBodyFDViolatingRows";
import { isIRequestBodyFDViolatingRows } from "@/definitions/IRequestBodyFDViolatingRows.guard";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { sqlUtils } from "../../db";

export default async function getViolatingRows(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
    }
    if (!isIRequestBodyFDViolatingRows(req.body)) {
      res.status(422).json({ errrors: "Invalid request body" });
      return;
    }

    const body: IRequestBodyFDViolatingRows =
      req.body as IRequestBodyFDViolatingRows;

    const result = await sqlUtils.getViolatingRowsForFDCount(
      body.sql,
      body.lhs,
      body.rhs
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res.status(502).json({
        error: "Could not get row count for functional dependency... ",
      });
  }
}
