import { Router } from 'express';
import {
  adminUpdateUserSchema,
  getAdminSummary,
  updateUserByAdmin
} from '../controllers/adminController.js';
import { authenticate, ensureDbConnected, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(ensureDbConnected);
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/summary', getAdminSummary);
router.patch('/users/:id', validateBody(adminUpdateUserSchema), updateUserByAdmin);

export default router;
