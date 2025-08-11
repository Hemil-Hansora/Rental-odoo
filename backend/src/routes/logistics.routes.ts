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

router.route('/')
    .post(createDeliveryNote)
    .get(getAllDeliveryNotes);

router.route('/:id')
    .patch(updateDeliveryNote);

export default router;