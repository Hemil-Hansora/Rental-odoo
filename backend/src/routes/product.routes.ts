import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    checkProductAvailability,
} from "../controllers/product.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/all-product").get(getAllProducts);
router.route("/get-product/:id").get(getProductById);
router.route("/availability/:id").get(checkProductAvailability);
router.use(verifyJWT);
router.route("/create-product").post( upload.array("images", 1),createProduct);
router.route("/update/:id").patch(updateProduct) 
router.route("/delete/:id").delete(deleteProduct);


export default router;