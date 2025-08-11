import { Router } from 'express';
import { 
    createQuotation,
    getAllQuotationsForUser,
    getQuotationByIdForUser,
    updateQuotationStatusForUser,
    deleteQuotationForUser
} from '../controllers/quotation.controller';
import { verifyJWT, authorizeRoles } from '../middlewares/index';

const router = Router();

// All quotation routes require a user to be logged in
router.use(verifyJWT);

// --- Customer-Only Route ---
// Only a 'customer' (vendor) can initiate the creation of a quote
router.route('/')
    .post(authorizeRoles('customer'), createQuotation);

// --- Routes for the Logged-in User (Customer or End User) ---
// Any logged-in user can view their own quotation history

router.use(authorizeRoles("end_user"))
router.route('/')
    .get(getAllQuotationsForUser);

// Any logged-in user can manage a specific quotation they own
router.route('/:id')
    .get(getQuotationByIdForUser)
    .delete(deleteQuotationForUser);

// Route for updating a quotation's status
router.route('/:id/status')
    .patch(updateQuotationStatusForUser);


export default router;