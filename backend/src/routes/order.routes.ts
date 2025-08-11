import { Router } from 'express';
import { 
    createOrderFromQuotation,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
} from '../controllers/order.controller';
import { verifyJWT, authorizeRoles } from "../middlewares/index";

const router = Router();

router.use(verifyJWT);


router.route('/from-quotation').post(
    authorizeRoles('customer'), 
    createOrderFromQuotation
);

router.route('/myOrder').get(
    authorizeRoles('customer'), 
    getMyOrders
);

router.route('/status/:id').patch(
    authorizeRoles('end_user'), 
    updateOrderStatus
);

router.route('/get-order/:id').get(
    authorizeRoles('customer', 'end_user'),
    getOrderById
);

router.route('/cancel/:id').post(
    authorizeRoles('customer'), 
    cancelOrder
); 

export default router;