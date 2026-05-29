import { Router } from "express";
import type { IRouter } from "express";
import * as userController from "../controllers/user.controller.js";
import {
  userLoginInputRules,
  userRegisterInputRules,
} from "../validators/user.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const userRouter: IRouter = Router();

userRouter.post(
  "/register",
  userRegisterInputRules,
  validate,
  userController.registerUser,
);

userRouter.post(
  "/login",
  userLoginInputRules,
  validate,
  userController.loginUser,
);

export default userRouter;
