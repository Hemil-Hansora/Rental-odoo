import { Router } from 'express';
import { recordPayment } from '../controllers/payment.controller';
import { verifyJWT, authorizeRoles } from "../middlewares/index";

const router = Router();

// All payment routes are protected and for customers (staff) only
router.use(verifyJWT, authorizeRoles('customer'));

router.route('/').post(recordPayment);

export default router;