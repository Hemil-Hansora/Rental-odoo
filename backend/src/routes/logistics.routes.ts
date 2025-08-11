import { Router } from 'express';
import {
    createDeliveryNote,
    getAllDeliveryNotes,
    updateDeliveryNote
} from '../controllers/logistics.controller';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// All logistics routes are for internal staff (customer role) only
router.use(verifyJWT, authorizeRoles('customer'));

router.route('/create-delivery-note').post(createDeliveryNote)
router.route('/getAll')
    .get(getAllDeliveryNotes);

router.route('/update/:id').patch(updateDeliveryNote);

export default router;