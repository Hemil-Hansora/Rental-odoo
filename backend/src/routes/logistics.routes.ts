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

<<<<<<< HEAD
router.route('/create').post(createDeliveryNote)
router.route('/getAll').get(getAllDeliveryNotes);
=======
router.route('/create-delivery-note').post(createDeliveryNote)
router.route('/getAll')
    .get(getAllDeliveryNotes);
>>>>>>> afafa4c70a9e06f6bcc98f7d5312591526306400

router.route('/update/:id').patch(updateDeliveryNote);

export default router;