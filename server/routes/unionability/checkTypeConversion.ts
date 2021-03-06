import { sqlUtils } from "@/db";
import { IRequestBodyTypeCasting as IRequestBodyTypeCasting } from "@/definitions/TypeCasting";
import { isIRequestBodyTypeCasting } from "@/definitions/TypeCasting.guard";
import { Request, Response } from "express";
import { validationResult } from "express-validator";

export default async function checkTypeCasting(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
    }

    if (!isIRequestBodyTypeCasting(req.body)) {
      res.status(422).json({ errors: "Invalid request body." });
      return;
    }
    res
      .status(200)
      .json(
        await sqlUtils.testTypeCasting(req.body as IRequestBodyTypeCasting)
      );
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Error while trying to test type casting." });
  }
}
