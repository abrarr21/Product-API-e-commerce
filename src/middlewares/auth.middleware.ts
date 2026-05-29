import type { NextFunction, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/config.js";
import type { AuthentcatedRequest } from "../type/index.js";

export const requireAuth = (
  req: AuthentcatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      message: "unauthorized user: no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    console.log("error in auth middleware", error);
    return res.status(500).json({
      messagge: "internal server error",
    });
  }
};
