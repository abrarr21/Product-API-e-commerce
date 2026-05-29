import type { Request, Response, NextFunction, RequestHandler } from "express";
import userModel from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 @route       POST /api/auth/register
 @desc        Create a new user, hash the password, save it to database
 @access      Public
 @param       {Request} req - Express request object containing name, email, and password in req.body
 @param       {Response} res - Express response object
 @param       {NextFunction} next - Express next function for error handling
 @returns     {Response} 201 - Success response confirming user creation and assigning cookie
 @returns     {Response} 409 - Conflict error if a user with the provided email already exists
 @returns     {Response} 500 - Internal server error handling unforeseen database or runtime issues
 */
export const registerUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const userAlreadyExist = await userModel.findOne({ email });
    if (userAlreadyExist) {
      throw new ApiError(409, "user with email already exists");
    }

    const newUser = await userModel.create({ name, email, password });

    const accessToken = generateToken(newUser);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.status(201).json({
      message: "user created successfully",
    });
  },
);

/**
 @route       POST /api/auth/login
 @desc        Checks if user exist, matches the valid credentials, assigning accessToken and logs in the user
 @access      Public
 @param       {Request} req - Express request object containing email, and password in req.body
 @param       {Response} res - Express response object
 @param       {NextFunction} next - Express next funciton for error handling
 @returns     {Response} 200 - Success response confirming user existence and assigning cookie
 @returns     {Response} 401 - Error if invalid credentials
 @returns     {Response} 500 - Internal server error handling log in
 */
export const loginUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      throw new ApiError(401, "user not found");
    }

    if (!(await user.matchedPassword(password))) {
      throw new ApiError(401, "invalid email or password");
    }

    const accessToken = generateToken(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Login successfully",
    });
  },
);
