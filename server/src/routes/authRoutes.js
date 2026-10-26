import { Router } from 'express';
import { getMe, login, loginSchema, register, registerSchema } from '../controllers/authController.js';
import { authenticate, ensureDbConnected } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(ensureDbConnected);

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
