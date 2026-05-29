import type { NextFunction, Request, RequestHandler, Response } from "express";
import imageKitClient from "../config/imageKit.js";
import { toFile } from "@imagekit/nodejs";
import productModel from "../models/product.model.js";
import type { Iimage } from "../models/product.model.js";
import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 @route       POST /api/products
 @desc        Create a new product and save to database
 @access      Private
 @param       {Request} req - Express request object containing name, description, price, category and images in req.body
 @param       {Response} res - Express response object
 @param       {NextFunction} next - Express next function for error handling
 @returns     {Response} 201 - Success response confirming product creation
 @returns     {Response} 400 - Error response when no images are provided
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues or image upload failed
 */
export const createProduct: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, category, price } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new ApiError(400, "No image provided");
    }

    const imgUploads = files.map(async (file) =>
      imageKitClient.files.upload({
        file: await toFile(file.buffer, file.originalname),
        fileName: file.originalname,
        useUniqueFileName: true,
      }),
    );

    const results = await Promise.allSettled(imgUploads);

    const uploaded = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value)
      .map((r) => ({
        url: r.url,
        name: r.name,
        fileId: r.fileId,
        originalName: r.originalname,
      }));

    const failedCount = results.filter((r) => r.status === "rejected").length;

    if (uploaded.length === 0) {
      return res.status(500).json({ message: "all images upload failed" });
    }

    const product = await productModel.create({
      name,
      description,
      price: Number(price),
      category,
      images: uploaded,
    });

    return res.status(201).json({
      success: true,
      message: `Product created with ${uploaded.length} image(s)${failedCount ? `, ${failedCount} failed` : ""}`,
      product,
    });
  },
);

/**
 @route       GET /api/products
 @desc        Fetches all the product from the database
 @access      Public
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @param       {NextFunction} next - Express next function for error handling
 @returns     {Response} 200 - Success response when all products are fetched
 @returns     {Response} 404 - Error response when there are no products in the database
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const getAllProducts: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { category } = req.query;
    const filter: Record<string, any> = {};

    if (category) {
      filter.category = category;
    }

    const allProducts = await productModel.find(filter);
    if (allProducts.length === 0) {
      throw new ApiError(404, "No products found");
    }

    return res.status(200).json({
      message: "all products fetched successfully",
      allProducts,
    });
  },
);

/**
 @route       GET /api/products/:id
 @desc        Fetches the product with ID from the database
 @access      Public
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @param       {NextFunction} next - Express next function for error handling
 @returns     {Response} 200 - Success response when product is fetched
 @returns     {Response} 404 - Error response when product is not found
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const getProductById: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params as { id: string };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "invalid product ID");
  }

  const product = await productModel.findById(id);

  if (!product) {
    throw new ApiError(404, "No product with this ID");
  }

  return res.status(200).json({
    message: "product is fetched successfully",
    product,
  });
};

/**
 @route       PATCH /api/products/:id
 @desc        Update the product with provided fields
 @access      Private
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @param       {NextFunction} next - Express next function for error handling
 @returns     {Response} 200 - Success response when product is updated
 @returns     {Response} 400 - Error response when product id is invalid
 @returns     {Response} 404 - Error response when product is not found
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const updateProduct: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params as { id: string };
  const { name, description, price, category } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "invalid product ID");
  }

  const product = await productModel.findById(id);
  if (!product) {
    throw new ApiError(404, "product not found");
  }

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (category !== undefined) product.category = category;

  await product.save();

  return res.status(200).json({
    message: "product updated successfully",
    product,
  });
};

/**
 @route       DELETE /api/products/:id
 @desc        delete the product with provided fields
 @access      Private
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @param       {NextFunction} next - Express next function for error handling
 @returns     {Response} 200 - Success response when product is deleted
 @returns     {Response} 400 - Error response when product id is invalid
 @returns     {Response} 404 - Error response when product is not found
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const deleteProduct: RequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "invalid product ID");
    }

    const product = await productModel.findById(id);

    if (!product) {
      throw new ApiError(404, "product not found");
    }

    // Delete all images from ImageKit
    if (product.images && product.images.length > 0) {
      const deleteImg = (product.images as Iimage[]).map((img) =>
        imageKitClient.files.delete(img.fileId),
      );
      await Promise.allSettled(deleteImg);
    }

    await productModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "product deleted successfully",
    });
  },
);
