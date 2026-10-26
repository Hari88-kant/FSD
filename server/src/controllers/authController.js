import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/db.js';
import { User } from '../models/User.js';
import { TechnicianProfile } from '../models/TechnicianProfile.js';
import { AppError, sendSuccess } from '../utils/errors.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
  phone: z.string().trim().optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  // Public registration strictly disallows 'admin' per Section 9 & FR-01
  role: z.enum(['customer', 'technician']).optional().default('customer'),
  skills: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, phone, password, role, skills, serviceAreas, lat, lng } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role
    });

    let technicianProfile = null;
    if (role === 'technician') {
      const profileData = {
        userId: user._id,
        skills: skills?.length
          ? skills
          : ['power_outage', 'voltage_fluctuation', 'meter_fault', 'fuse_blown'],
        serviceAreas: serviceAreas?.length ? serviceAreas : ['General Zone'],
        isAvailable: true
      };
      if (typeof lat === 'number' && typeof lng === 'number') {
        profileData.location = {
          type: 'Point',
          coordinates: [lng, lat]
        };
        profileData.lastLocationAt = new Date();
      }
      technicianProfile = await TechnicianProfile.create(profileData);
    }

    const token = signToken(user);

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive
        },
        technicianProfile
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This account has been deactivated by an administrator');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signToken(user);
    let technicianProfile = null;
    if (user.role === 'technician') {
      technicianProfile = await TechnicianProfile.findOne({ userId: user._id });
    }

    return sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      },
      technicianProfile
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    let technicianProfile = null;
    if (req.user.role === 'technician') {
      technicianProfile = await TechnicianProfile.findOne({ userId: req.user.id });
    }
    return sendSuccess(res, {
      user: req.user,
      technicianProfile
    });
  } catch (err) {
    next(err);
  }
}
