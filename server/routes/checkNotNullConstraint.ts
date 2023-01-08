import { sqlUtils } from "@/db";
import { IRequestBodyNotNull } from "@/definitions/IRequestBodyNotNull";
import { isIRequestBodyNotNull } from "@/definitions/IRequestBodyNotNull.guard";
import { Request, Response } from "express";
import { validationResult } from "express-validator";

export default async function checkNotNull(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
    }

    if (!isIRequestBodyNotNull(req.body)) {
      res.status(422).json({ errors: "Invalid request body." });
      return;
    }

    res
      .status(200)
      .json(
        await sqlUtils.testNotNullConstraint(req.body as IRequestBodyNotNull)
      );
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Error while trying to test nullability." });
  }
}
