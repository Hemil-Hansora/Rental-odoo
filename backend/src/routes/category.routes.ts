import { Router } from 'express';
import { 
    createCategory, 
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/category.controller';
import { verifyJWT, authorizeRoles } from "../middlewares/index"

const router = Router();

router.route('/all-categories').get(getAllCategories);
router.route('/category/:id').get(getCategoryById);


router.use(verifyJWT, authorizeRoles("end_user"));

router.route('/create-category').post(createCategory);
router.route('/update/:id').patch(updateCategory);
router.route('/delete/:id').delete(deleteCategory);

export default router;