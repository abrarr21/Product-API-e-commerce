import { Router } from "express";
import type { IRouter } from "express";
import * as productController from "../controllers/product.controller.js";
import { upload } from "../config/multer.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  productFieldRules,
  productUpdateRules,
} from "../validators/product.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const productRouter: IRouter = Router();

productRouter.post(
  "/",
  upload.array("images", 5),
  requireAuth,
  productFieldRules,
  validate,
  productController.createProduct,
);

productRouter.get("/", productController.getAllProducts);

productRouter.get("/:id", productController.getProductById);

productRouter.patch(
  "/:id",
  requireAuth,
  productUpdateRules,
  validate,
  productController.updateProduct,
);

export default productRouter;
