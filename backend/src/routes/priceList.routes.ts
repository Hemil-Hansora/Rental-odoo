import { Router } from 'express';
import {
    createPricelist,
    getAllPricelists,
    getPricelistById,
    updatePricelist,
    deletePricelist
} from '../controllers/priceList.controller';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// All pricelist routes are for internal staff (customer role) only
router.use(verifyJWT, authorizeRoles('customer'));

router.route('/crete_pricelist').post(createPricelist)
router.route('/get_all_pricelists').get(getAllPricelists);

router.route('/get_pricelist_by_id/:id').get(getPricelistById)
router.route('/update_pricelist/:id').patch(updatePricelist)
router.route('/delete_pricelist/:id').delete(deletePricelist);

export default router;