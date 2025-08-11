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

router.use(verifyJWT);
router.route('/create')
    .post(authorizeRoles('customer'), createQuotation);


router.use(authorizeRoles("end_user"))

router.route('/getAllUserQuotations')
    .get(getAllQuotationsForUser);

router.route('/getQuotation/:id')
    .get(getQuotationByIdForUser)
    .delete(deleteQuotationForUser);

router.route('/status/:id')
    .patch(updateQuotationStatusForUser);


export default router;