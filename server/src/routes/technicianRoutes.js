import { Router } from 'express';
import {
  availabilitySchema,
  getNearbyTechnicians,
  locationSchema,
  updateAvailability,
  updateLocation
} from '../controllers/technicianController.js';
import { authenticate, ensureDbConnected, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(ensureDbConnected);
router.use(authenticate);

router.get('/nearby', getNearbyTechnicians);
router.patch(
  '/me/availability',
  requireRole('technician'),
  validateBody(availabilitySchema),
  updateAvailability
);
router.patch(
  '/me/location',
  requireRole('technician'),
  validateBody(locationSchema),
  updateLocation
);

export default router;
