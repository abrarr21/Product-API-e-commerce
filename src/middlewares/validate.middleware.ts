import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

// Reusable error handling middlware [Validation]
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.type === "field" ? err.path : undefined,
        message: err.msg,
      })),
    });
  }

  next();
};
