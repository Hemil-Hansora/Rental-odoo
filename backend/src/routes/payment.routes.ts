import { Router } from 'express';
import { getAllPayments, getPaymentById, recordPayment, refundPayment } from '../controllers/payment.controller';
import { verifyJWT, authorizeRoles } from "../middlewares/index";

const router = Router();

// All payment routes are protected and for customers (staff) only
router.use(verifyJWT);

router.route('/')
    .post(recordPayment)
    .get(getAllPayments);

router.route('/:id')
    .get(getPaymentById);

router.route('/:id/refund')
    .post(refundPayment);



export default router;