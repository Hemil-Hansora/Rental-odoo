import { Router } from 'express';
import { 
    createInvoiceFromOrder,
    getAllInvoices,
    getInvoiceById
} from '../controllers/invoice.controller';
import { verifyJWT, authorizeRoles } from '../middlewares/index';

const router = Router();

// All invoice routes are protected and for customers (staff) only
router.use(verifyJWT, authorizeRoles('customer'));

router.route('/from-order').post(createInvoiceFromOrder);
router.route('/').get(getAllInvoices);

// Add other routes here later:
router.route('/:id').get(getInvoiceById);

export default router;