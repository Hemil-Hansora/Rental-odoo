import { Router } from 'express';
import {
    createDiscount,
    getMyDiscounts,
    updateDiscount,
    deleteDiscount,
    applyDiscountCode
} from '../controllers/discount.controller';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// --- Customer Route ---
// A customer (renter) needs to be able to check if a code is valid
router.route('/apply').post(verifyJWT, authorizeRoles('customer'), applyDiscountCode);

// --- Vendor Routes ---
// Only an end_user (vendor) can manage discount codes
router.use(verifyJWT, authorizeRoles('end_user'));

router.route('/')
    .post(createDiscount)
    .get(getMyDiscounts);

router.route('/:id')
    .patch(updateDiscount)
    .delete(deleteDiscount);

export default router;