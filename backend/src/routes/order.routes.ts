import { Router } from 'express';
import { 
    createOrderFromQuotation,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
} from '../controllers/order.controller';
import { verifyJWT, authorizeRoles } from "../middlewares/index"

const router = Router();

// All order routes require a user to be logged in
router.use(verifyJWT);

// --- Routes accessible by both Customers and End Users ---
router.route('/from-quotation').post(createOrderFromQuotation);
router.route('/').get(getMyOrders);
router.route('/:id').get(getOrderById);
router.route('/:id/cancel').post(cancelOrder); // Both can initiate cancellation

// --- Customer-Only Route ---
// Only a customer (admin/staff) can update the main status of an order
router.route('/:id/status').patch(authorizeRoles('customer'), updateOrderStatus);


export default router;