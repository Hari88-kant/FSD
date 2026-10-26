import { z } from 'zod';
import { TechnicianProfile } from '../models/TechnicianProfile.js';
import { calculateHaversineKm } from '../utils/haversine.js';
import { AppError, sendSuccess } from '../utils/errors.js';

export const availabilitySchema = z.object({
  isAvailable: z.boolean()
});

export const locationSchema = z.object({
  lat: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  lng: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180')
});

export async function getNearbyTechnicians(req, res, next) {
  try {
    const lat = req.query.lat !== undefined ? parseFloat(req.query.lat) : null;
    const lng = req.query.lng !== undefined ? parseFloat(req.query.lng) : null;
    const radiusKm = req.query.radiusKm !== undefined ? parseFloat(req.query.radiusKm) : 50;
    const skill = req.query.skill;

    const hasValidCoords =
      lat !== null &&
      lng !== null &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    const filter = { isAvailable: true };
    if (skill) {
      filter.skills = skill;
    }

    const profiles = await TechnicianProfile.find(filter).populate(
      'userId',
      'name email phone isActive role'
    );

    const activeProfiles = profiles.filter((p) => p.userId && p.userId.isActive);

    const results = activeProfiles
      .map((profile) => {
        const coords = profile.location?.coordinates; // [lng, lat]
        let distanceKm = null;

        if (hasValidCoords && Array.isArray(coords) && coords.length === 2) {
          const [techLng, techLat] = coords;
          distanceKm = calculateHaversineKm(lat, lng, techLat, techLng);
        }

        return {
          technicianId: profile.userId._id,
          name: profile.userId.name,
          phone: profile.userId.phone,
          skills: profile.skills,
          serviceAreas: profile.serviceAreas,
          isAvailable: profile.isAvailable,
          rating: profile.rating,
          coordinates:
            Array.isArray(coords) && coords.length === 2
              ? { lat: coords[1], lng: coords[0] }
              : null,
          lastLocationAt: profile.lastLocationAt,
          distanceKm
        };
      })
      .filter((item) => {
        if (!hasValidCoords || item.distanceKm === null) return true;
        return item.distanceKm <= radiusKm;
      })
      .sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

    return sendSuccess(res, {
      technicians: results,
      disclaimer:
        'Distances shown are straight-line (Haversine) calculations in kilometers. Actual road travel distance and arrival time may differ.'
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAvailability(req, res, next) {
  try {
    const { isAvailable } = req.body;
    let profile = await TechnicianProfile.findOne({ userId: req.user.id });

    if (!profile) {
      profile = await TechnicianProfile.create({
        userId: req.user.id,
        isAvailable
      });
    } else {
      profile.isAvailable = isAvailable;
      await profile.save();
    }

    return sendSuccess(res, { technicianProfile: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req, res, next) {
  try {
    const { lat, lng } = req.body;
    let profile = await TechnicianProfile.findOne({ userId: req.user.id });

    if (!profile) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', 'Technician profile not found');
    }

    // Store in GeoJSON [longitude, latitude] order per Section 9
    profile.location = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    profile.lastLocationAt = new Date();
    await profile.save();

    return sendSuccess(res, {
      technicianProfile: profile,
      coordinates: { lat, lng }
    });
  } catch (err) {
    next(err);
  }
}
