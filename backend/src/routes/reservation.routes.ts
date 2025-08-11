import { Router } from 'express';
import {
    getAllReservations,
    getReservationById
} from '../controllers/reservation.controller';
import { verifyJWT, authorizeRoles } from "../middlewares/index";

const router = Router();

// All reservation routes are for internal staff (customer role) only
router.use(verifyJWT, authorizeRoles('customer'));

router.route('/getAll')
    .get(getAllReservations);

router.route('/getreservation/:id')
    .get(getReservationById);

export default router;