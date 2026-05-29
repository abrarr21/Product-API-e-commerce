import type { HydratedDocument } from "mongoose";
import type { IUser } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const generateToken = (user: HydratedDocument<IUser>) => {
  return jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "1h" });
};
