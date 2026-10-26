import { z } from 'zod';
import { User } from '../models/User.js';
import { TechnicianProfile } from '../models/TechnicianProfile.js';
import { Complaint } from '../models/Complaint.js';
import { AppError, sendSuccess } from '../utils/errors.js';

export const adminUpdateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['customer', 'technician', 'admin']).optional(),
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional()
});

export async function getAdminSummary(req, res, next) {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalTechnicians,
      availableTechnicians,
      totalComplaints,
      pendingComplaints,
      activeComplaints,
      resolvedComplaints,
      cancelledComplaints,
      users,
      technicianProfiles
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'technician' }),
      TechnicianProfile.countDocuments({ isAvailable: true }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: { $in: ['assigned', 'accepted', 'on_the_way', 'in_progress'] } }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'cancelled' }),
      User.find().sort({ createdAt: -1 }).limit(100),
      TechnicianProfile.find().populate('userId', 'name email phone isActive')
    ]);

    return sendSuccess(res, {
      counts: {
        totalUsers,
        totalCustomers,
        totalTechnicians,
        availableTechnicians,
        totalComplaints,
        pendingComplaints,
        activeComplaints,
        resolvedComplaints,
        cancelledComplaints
      },
      users,
      technicians: technicianProfiles
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserByAdmin(req, res, next) {
  try {
    const { isActive, role, name, phone } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (user._id.toString() === req.user.id && isActive === false) {
      throw new AppError(400, 'CANNOT_DEACTIVATE_SELF', 'Administrators cannot deactivate their own account');
    }

    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (role) user.role = role;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    if (user.role === 'technician') {
      const existingProfile = await TechnicianProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await TechnicianProfile.create({ userId: user._id, isAvailable: true });
      }
    }

    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
