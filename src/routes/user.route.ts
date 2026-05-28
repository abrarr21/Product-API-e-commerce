import { Router } from "express";
import type { IRouter } from "express";
import * as userController from "../controllers/user.controller.js";
import { userRegisterInputRules } from "../validators/user.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const userRouter: IRouter = Router();

userRouter.post(
  "/register",
  userRegisterInputRules,
  validate,
  userController.registerUser,
);

export default userRouter;
