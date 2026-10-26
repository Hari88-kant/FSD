import mongoose from 'mongoose';

export const COMPLAINT_STATUSES = [
  'pending',
  'assigned',
  'accepted',
  'rejected',
  'on_the_way',
  'in_progress',
  'resolved',
  'cancelled'
];

export const PROBLEM_TYPES = [
  'power_outage',
  'voltage_fluctuation',
  'meter_fault',
  'fuse_blown',
  'billing_or_connection',
  'sparking_or_exposed_wire',
  'other'
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    // GeoJSON order: [longitude, latitude]
    coordinates: {
      type: [Number],
      validate: {
        validator: (coords) =>
          Array.isArray(coords) &&
          coords.length === 2 &&
          coords[0] >= -180 &&
          coords[0] <= 180 &&
          coords[1] >= -90 &&
          coords[1] <= 90,
        message: 'Coordinates must be [longitude, latitude] within valid bounds'
      }
    }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    problemType: {
      type: String,
      enum: PROBLEM_TYPES,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: geoPointSchema,
      default: undefined
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: 'pending',
      index: true
    },
    isHazardous: {
      type: Boolean,
      default: false
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ location: '2dsphere' }, { sparse: true });

export const Complaint = mongoose.model('Complaint', complaintSchema);
