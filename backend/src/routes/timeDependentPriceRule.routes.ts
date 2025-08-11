import { Router } from 'express';
import {
    createTimeDependentPriceRule,
    getAllTimeDependentPriceRules,
    getTimeDependentPriceRuleById,
    updateTimeDependentPriceRule,
    deleteTimeDependentPriceRule
} from '../controllers/timeDependentPriceRule.controller';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// All routes are for vendors (end_user role) only
router.use(verifyJWT, authorizeRoles('end_user'));

router.route('/')
    .post(createTimeDependentPriceRule)
    .get(getAllTimeDependentPriceRules);

router.route('/:id')
    .get(getTimeDependentPriceRuleById)
    .patch(updateTimeDependentPriceRule)
    .delete(deleteTimeDependentPriceRule);

export default router;