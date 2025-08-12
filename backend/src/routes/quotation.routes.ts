import { Router } from 'express';
import { 
    createQuotation,
    getAllQuotationsForUser,
    getQuotationByIdForUser,
    updateQuotationStatusForUser,
    deleteQuotationForUser,
<<<<<<< HEAD
    approvedQuotationsProducts
=======
    getMyApprovedQuotations
>>>>>>> 273165b023bc90427061c13767a43cedcaf5201a
} from '../controllers/quotation.controller';
import { verifyJWT, authorizeRoles } from '../middlewares/index';

const router = Router();

router.use(verifyJWT);
router.route('/create')
    .post(authorizeRoles('customer'), createQuotation);
router.route('/deleteQuotation/:id').delete(deleteQuotationForUser);
router.route('/my-approved') // <-- Corrected route name for consistency
    .get(authorizeRoles('customer'), getMyApprovedQuotations)
router.use(authorizeRoles("end_user"))

router.route('/getAllUserQuotations').get(getAllQuotationsForUser);

router.route('/getQuotation/:id').get(getQuotationByIdForUser)
router.route('/status/:id').patch(updateQuotationStatusForUser);
router.route('/approvedProducts/:id').get(approvedQuotationsProducts);

export default router;