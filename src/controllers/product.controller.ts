import type { Request, Response } from "express";
import imageKitClient from "../config/imageKit.js";
import { toFile } from "@imagekit/nodejs";
import productModel from "../models/product.model.js";
import type { Iimage } from "../models/product.model.js";
import mongoose from "mongoose";

/**
 @route       POST /api/products
 @desc        Create a new product and save to database
 @access      Private
 @param       {Request} req - Express request object containing name, description, price, category and images in req.body
 @param       {Response} res - Express response object
 @returns     {Response} 201 - Success response confirming product creation
 @returns     {Response} 400 - Error response when no images are provided
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues or image upload failed
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, category, price } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No image provided",
      });
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
  } catch (error) {
    console.log("error while creating product", error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 @route       GET /api/products
 @desc        Fetches all the product from the database
 @access      Public
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @returns     {Response} 200 - Success response when all products are fetched
 @returns     {Response} 404 - Error response when there are no products in the database
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const getAllProducts = async (req: Request, res: Response) => {
  const { category } = req.query;
  try {
    const filter: Record<string, any> = {};

    if (category) {
      filter.category = category;
    }

    const allProducts = await productModel.find(filter);
    if (allProducts.length === 0) {
      return res.status(404).json({
        message: "No products found",
      });
    }

    return res.status(200).json({
      message: "all products fetched successfully",
      allProducts,
    });
  } catch (error) {
    console.log("error fetching all products", error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 @route       GET /api/products/:id
 @desc        Fetches the product with ID from the database
 @access      Public
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @returns     {Response} 200 - Success response when product is fetched
 @returns     {Response} 404 - Error response when product is not found
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "invalid product ID",
    });
  }

  try {
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "No product with this id",
      });
    }

    return res.status(200).json({
      message: "product is fetched successfully",
      product,
    });
  } catch (error) {
    console.log("error fetching product with id", error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 @route       PATCH /api/products/:id
 @desc        Update the product with provided fields
 @access      Private
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @returns     {Response} 200 - Success response when product is updated
 @returns     {Response} 400 - Error response when product id is invalid
 @returns     {Response} 404 - Error response when product is not found
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { name, description, price, category } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "invalid product id",
    });
  }

  try {
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "product not found",
      });
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
  } catch (error) {
    console.log("error updating product", error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 @route       DELETE /api/products/:id
 @desc        delete the product with provided fields
 @access      Private
 @param       {Request} req - Express request object
 @param       {Response} res - Express response object
 @returns     {Response} 200 - Success response when product is deleted
 @returns     {Response} 400 - Error response when product id is invalid
 @returns     {Response} 404 - Error response when product is not found
 @returns     {Response} 500 - Internal server error handling unforeseen database, runtime issues
 */
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      error: "invalid product id",
    });
    return;
  }

  try {
    const product = await productModel.findById(id);

    if (!product) {
      res.status(404).json({
        message: "product not found",
      });
      return;
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
  } catch (error) {
    console.log("error deleting product", error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};
