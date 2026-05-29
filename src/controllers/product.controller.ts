import type { Request, Response } from "express";
import imageKitClient from "../config/imageKit.js";
import { toFile } from "@imagekit/nodejs";
import productModel from "../models/product.model.js";

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
