import mongoose from 'mongoose';

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

const technicianProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    technicianBadgeId: {
      type: String,
      trim: true,
      sparse: true,
      default: undefined
    },
    skills: {
      type: [String],
      default: ['general_fault', 'meter_issue', 'power_outage', 'voltage_fluctuation']
    },
    serviceAreas: {
      type: [String],
      default: []
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    location: {
      type: geoPointSchema,
      default: undefined
    },
    lastLocationAt: {
      type: Date,
      default: null
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.8
    }
  },
  {
    timestamps: true
  }
);

technicianProfileSchema.index({ location: '2dsphere' }, { sparse: true });

export const TechnicianProfile = mongoose.model('TechnicianProfile', technicianProfileSchema);
