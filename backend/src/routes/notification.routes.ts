import { Router } from 'express';
import { 
    getMyNotifications,
    markNotificationsAsRead
} from '../controllers/notification.controller';
import { verifyJWT } from "../middlewares/index";

const router = Router();

// All notification routes are private
router.use(verifyJWT);

router.route('/')
    .get(getMyNotifications);

router.route('/read')
    .patch(markNotificationsAsRead);

export default router;