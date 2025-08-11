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

// --- Public Routes ---
router.route('/').get(getAllCategories);
router.route('/:id').get(getCategoryById);


router.use(verifyJWT, authorizeRoles("end_user"));

router.route('/').post(createCategory);
router.route('/:id').patch(updateCategory);
router.route('/:id').delete(deleteCategory);

export default router;