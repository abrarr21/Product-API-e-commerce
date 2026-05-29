import mongoose from "mongoose";

export enum ProductCategory {
  ELECTRONICS = "electronics",
  ACCESSORIES = "accessories",
  CLOTHING = "clothing",
  FOOTWEAR = "footwear",
  HOME_AND_KITCHEN = "home_and_kitchen",
  SPORTS = "sports",
  BOOKS = "books",
  OTHER = "other",
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: true,
    },

    images: [
      {
        url: {
          type: String,
        },
        name: {
          type: String,
        },
        fileId: {
          type: String,
        },
        originalName: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true },
);

const productModel = mongoose.model("product", productSchema);

export default productModel;
