import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    checkProductAvailability,
    getMyProducts
} from "../controllers/product.controller";
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/all-product").get(getAllProducts);
router.route("/get-product/:id").get(getProductById);
router.route("/availability/:id").get(checkProductAvailability);
router.use(verifyJWT);
router.route("/create-product").post(authorizeRoles("end_user"), upload.array("images", 1),createProduct);
router.route("/update/:id").patch(authorizeRoles("end_user"),updateProduct) 
router.route("/delete/:id").delete(authorizeRoles("end_user"),deleteProduct);
router.route("/my-products").get(authorizeRoles("end_user"), getMyProducts);

    
export default router;