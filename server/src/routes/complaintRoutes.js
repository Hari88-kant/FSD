import { Router } from 'express';
import {
  acceptComplaint,
  assignComplaint,
  assignComplaintSchema,
  cancelOrDeleteComplaint,
  createComplaint,
  createComplaintSchema,
  getComplaintById,
  getLiveActivityFeed,
  listComplaints,
  rejectComplaint,
  submitFeedback,
  submitFeedbackSchema,
  updateComplaint,
  updateComplaintSchema
} from '../controllers/complaintController.js';
import { authenticate, ensureDbConnected, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(ensureDbConnected);

// Public live grid activity feed for interactive ticker
router.get('/live-feed', getLiveActivityFeed);

// Protected routes below
router.use(authenticate);

router.get('/', listComplaints);
router.post('/', requireRole('customer'), validateBody(createComplaintSchema), createComplaint);
router.get('/:id', getComplaintById);
router.patch('/:id', validateBody(updateComplaintSchema), updateComplaint);
router.delete('/:id', cancelOrDeleteComplaint);

router.post('/:id/assign', requireRole('admin', 'customer'), validateBody(assignComplaintSchema), assignComplaint);
router.post('/:id/accept', requireRole('technician'), acceptComplaint);
router.post('/:id/reject', requireRole('technician'), rejectComplaint);
router.post('/:id/feedback', requireRole('customer'), validateBody(submitFeedbackSchema), submitFeedback);

export default router;
