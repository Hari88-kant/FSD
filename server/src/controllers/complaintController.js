import { z } from 'zod';
import { Complaint, PROBLEM_TYPES } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { TechnicianProfile } from '../models/TechnicianProfile.js';
import { AppError, sendSuccess } from '../utils/errors.js';

export const createComplaintSchema = z.object({
  problemType: z.enum(PROBLEM_TYPES),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  address: z.string().trim().optional().default(''),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable()
});

export const updateComplaintSchema = z.object({
  status: z.enum(['on_the_way', 'in_progress', 'resolved', 'cancelled', 'pending']).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  address: z.string().trim().optional(),
  note: z.string().trim().max(500).optional().default('')
});

export const assignComplaintSchema = z.object({
  technicianId: z.string().min(1, 'technicianId is required')
});

const VALID_TECH_TRANSITIONS = {
  accepted: ['on_the_way', 'in_progress'],
  on_the_way: ['in_progress'],
  in_progress: ['resolved']
};

const HAZARD_KEYWORDS = ['spark', 'exposed wire', 'burning', 'fire', 'live wire', 'shock'];

function detectHazard(problemType, description) {
  if (problemType === 'sparking_or_exposed_wire') return true;
  const lower = description.toLowerCase();
  return HAZARD_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function createComplaint(req, res, next) {
  try {
    const { problemType, description, address, lat, lng } = req.body;
    const isHazardous = detectHazard(problemType, description);

    const doc = {
      customerId: req.user.id,
      problemType,
      description,
      address,
      isHazardous,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user.id,
          note: 'Complaint submitted by customer'
        }
      ]
    };

    if (typeof lat === 'number' && typeof lng === 'number') {
      // MongoDB GeoJSON stores [longitude, latitude]
      doc.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }

    const complaint = await Complaint.create(doc);
    const populated = await Complaint.findById(complaint._id)
      .populate('customerId', 'name email phone')
      .populate('technicianId', 'name email phone');

    return sendSuccess(
      res,
      {
        complaint: populated,
        safetyWarning: isHazardous
          ? 'URGENT SAFETY WARNING: Your report mentions a potentially hazardous electrical condition (sparking, exposed wires, or burning smell). Stay clear of the area, never touch electrical infrastructure, and contact your official electricity utility emergency line or emergency services (112) immediately.'
          : null
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function listComplaints(req, res, next) {
  try {
    const { status, problemType, page = '1', limit = '25' } = req.query;
    const filter = {};

    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    } else if (req.user.role === 'technician') {
      // Technicians see complaints assigned to them OR eligible pending complaints
      filter.$or = [{ technicianId: req.user.id }, { status: 'pending', technicianId: null }];
    }

    if (status) filter.status = status;
    if (problemType) filter.problemType = problemType;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('customerId', 'name email phone')
        .populate('technicianId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Complaint.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      complaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplaintById(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('technicianId', 'name email phone')
      .populate('statusHistory.changedBy', 'name role');

    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const isOwner = complaint.customerId?._id?.toString() === req.user.id;
    const isAssignedTech = complaint.technicianId?._id?.toString() === req.user.id;
    const isEligiblePendingForTech =
      req.user.role === 'technician' && complaint.status === 'pending' && !complaint.technicianId;

    if (req.user.role !== 'admin' && !isOwner && !isAssignedTech && !isEligiblePendingForTech) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this complaint');
    }

    return sendSuccess(res, { complaint });
  } catch (err) {
    next(err);
  }
}

export async function updateComplaint(req, res, next) {
  try {
    const { status, description, address, note } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const isOwner = complaint.customerId.toString() === req.user.id;
    const isAssignedTech = complaint.technicianId?.toString() === req.user.id;

    if (req.user.role === 'customer') {
      if (!isOwner) {
        throw new AppError(403, 'FORBIDDEN', 'Customers can only update their own complaints');
      }
      if (status && status !== 'cancelled') {
        throw new AppError(403, 'INVALID_STATUS_CHANGE', 'Customers may only cancel pending complaints');
      }
      if (status === 'cancelled') {
        if (!['pending', 'assigned'].includes(complaint.status)) {
          throw new AppError(400, 'CANNOT_CANCEL', 'Only pending or unassigned complaints can be cancelled');
        }
        complaint.status = 'cancelled';
        complaint.statusHistory.push({
          status: 'cancelled',
          changedBy: req.user.id,
          note: note || 'Cancelled by customer'
        });
      }
      if (description && complaint.status === 'pending') complaint.description = description;
      if (address !== undefined && complaint.status === 'pending') complaint.address = address;
    } else if (req.user.role === 'technician') {
      if (!isAssignedTech) {
        throw new AppError(403, 'FORBIDDEN', 'Only the assigned technician can update this complaint');
      }
      if (!status) {
        throw new AppError(400, 'STATUS_REQUIRED', 'Status field is required for technician updates');
      }
      const allowed = VALID_TECH_TRANSITIONS[complaint.status] || [];
      if (!allowed.includes(status)) {
        throw new AppError(
          400,
          'INVALID_TRANSITION',
          `Cannot transition complaint from '${complaint.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`
        );
      }
      complaint.status = status;
      complaint.statusHistory.push({
        status,
        changedBy: req.user.id,
        note: note || `Status updated to ${status} by technician`
      });
    } else if (req.user.role === 'admin') {
      if (status) {
        complaint.status = status;
        complaint.statusHistory.push({
          status,
          changedBy: req.user.id,
          note: note || `Admin updated status to ${status}`
        });
      }
      if (description) complaint.description = description;
      if (address !== undefined) complaint.address = address;
    }

    await complaint.save();
    const updated = await Complaint.findById(complaint._id)
      .populate('customerId', 'name email phone')
      .populate('technicianId', 'name email phone');

    return sendSuccess(res, { complaint: updated });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrDeleteComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    const isOwner = complaint.customerId.toString() === req.user.id;

    if (req.user.role === 'customer') {
      if (!isOwner) {
        throw new AppError(403, 'FORBIDDEN', 'You can only cancel your own complaints');
      }
      if (!['pending', 'assigned'].includes(complaint.status)) {
        throw new AppError(
          400,
          'CANNOT_CANCEL',
          `Complaint in '${complaint.status}' state cannot be cancelled by customer`
        );
      }
      complaint.status = 'cancelled';
      complaint.statusHistory.push({
        status: 'cancelled',
        changedBy: req.user.id,
        note: 'Cancelled by customer via DELETE'
      });
      await complaint.save();
      return sendSuccess(res, { complaint, action: 'cancelled' });
    }

    if (req.user.role === 'admin') {
      complaint.status = 'cancelled';
      complaint.statusHistory.push({
        status: 'cancelled',
        changedBy: req.user.id,
        note: 'Cancelled/soft-deleted by administrator'
      });
      await complaint.save();
      return sendSuccess(res, { complaint, action: 'cancelled_by_admin' });
    }

    throw new AppError(403, 'FORBIDDEN', 'Technicians cannot delete or cancel complaints');
  } catch (err) {
    next(err);
  }
}

export async function assignComplaint(req, res, next) {
  try {
    const { technicianId } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    if (!['pending', 'rejected', 'assigned'].includes(complaint.status)) {
      throw new AppError(
        400,
        'INVALID_STATE_FOR_ASSIGNMENT',
        `Cannot assign technician when complaint status is '${complaint.status}'`
      );
    }

    const techUser = await User.findOne({ _id: technicianId, role: 'technician', isActive: true });
    if (!techUser) {
      throw new AppError(404, 'TECHNICIAN_NOT_FOUND', 'Active technician user not found');
    }

    const techProfile = await TechnicianProfile.findOne({ userId: techUser._id });
    if (techProfile && !techProfile.isAvailable && req.user.role !== 'admin') {
      throw new AppError(400, 'TECHNICIAN_UNAVAILABLE', 'Selected technician is currently unavailable');
    }

    // Customer can also trigger assignment of nearest available technician on their own pending complaint
    const isOwner = complaint.customerId.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isOwner) {
      throw new AppError(403, 'FORBIDDEN', 'Only an admin or the complaint owner can request technician assignment');
    }

    complaint.technicianId = techUser._id;
    complaint.status = 'assigned';
    complaint.statusHistory.push({
      status: 'assigned',
      changedBy: req.user.id,
      note: `Assigned to technician ${techUser.name}`
    });

    await complaint.save();
    const updated = await Complaint.findById(complaint._id)
      .populate('customerId', 'name email phone')
      .populate('technicianId', 'name email phone');

    return sendSuccess(res, { complaint: updated });
  } catch (err) {
    next(err);
  }
}

export async function acceptComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    // Prevent double acceptance with server-side checks (FR-09)
    if ( ['accepted', 'on_the_way', 'in_progress', 'resolved'].includes(complaint.status)) {
      throw new AppError(409, 'ALREADY_ACCEPTED', 'This complaint has already been accepted');
    }

    const isAssignedToMe = complaint.technicianId?.toString() === req.user.id;
    const isUnassignedPending = complaint.status === 'pending' && !complaint.technicianId;

    if (!isAssignedToMe && !isUnassignedPending) {
      throw new AppError(403, 'NOT_ASSIGNED_TO_YOU', 'This complaint is assigned to another technician');
    }

    complaint.technicianId = req.user.id;
    complaint.status = 'accepted';
    complaint.statusHistory.push({
      status: 'accepted',
      changedBy: req.user.id,
      note: 'Technician accepted the service request'
    });

    await complaint.save();
    const updated = await Complaint.findById(complaint._id)
      .populate('customerId', 'name email phone')
      .populate('technicianId', 'name email phone');

    return sendSuccess(res, { complaint: updated });
  } catch (err) {
    next(err);
  }
}

export async function rejectComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      throw new AppError(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found');
    }

    if (complaint.technicianId?.toString() !== req.user.id) {
      throw new AppError(403, 'NOT_ASSIGNED_TO_YOU', 'Only the assigned technician can reject this request');
    }

    if (!['assigned', 'accepted'].includes(complaint.status)) {
      throw new AppError(
        400,
        'CANNOT_REJECT',
        `Cannot reject a complaint currently in '${complaint.status}' status`
      );
    }

    // Return complaint to reassignable pending state per Section 11
    complaint.status = 'pending';
    complaint.technicianId = null;
    complaint.statusHistory.push({
      status: 'rejected',
      changedBy: req.user.id,
      note: req.body?.note || 'Technician rejected assignment; returned to pending queue for reassignment'
    });

    await complaint.save();
    const updated = await Complaint.findById(complaint._id)
      .populate('customerId', 'name email phone')
      .populate('technicianId', 'name email phone');

    return sendSuccess(res, { complaint: updated });
  } catch (err) {
    next(err);
  }
}
