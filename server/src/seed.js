import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { TechnicianProfile } from './models/TechnicianProfile.js';
import { Complaint } from './models/Complaint.js';

async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      TechnicianProfile.deleteMany({}),
      Complaint.deleteMany({})
    ]);

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Create controlled Admin account (Section 9)
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@smarteb.local',
      phone: '+91-9800000001',
      passwordHash,
      role: 'admin',
      isActive: true
    });

    // 2. Create Customers
    const [customer1, customer2] = await User.create([
      {
        name: 'Ananya Sharma',
        email: 'ananya@smarteb.local',
        phone: '+91-9845011122',
        passwordHash,
        role: 'customer',
        isActive: true
      },
      {
        name: 'Rohan Gowda',
        email: 'rohan@smarteb.local',
        phone: '+91-9845033344',
        passwordHash,
        role: 'customer',
        isActive: true
      }
    ]);

    // 3. Create Technicians with human-readable IDs and sample coordinates
    const [tech1, tech2, tech3] = await User.create([
      {
        name: 'Karthik Murthy (Line Tech)',
        email: 'karthik.tech@smarteb.local',
        phone: '+91-9900112233',
        passwordHash,
        role: 'technician',
        technicianBadgeId: 'EB-TECH-1001',
        isActive: true
      },
      {
        name: 'Suresh Babu (Senior Electrician)',
        email: 'suresh.tech@smarteb.local',
        phone: '+91-9900445566',
        passwordHash,
        role: 'technician',
        technicianBadgeId: 'EB-TECH-1002',
        isActive: true
      },
      {
        name: 'Prashanth Rao (Meter Specialist)',
        email: 'prashanth.tech@smarteb.local',
        phone: '+91-9900778899',
        passwordHash,
        role: 'technician',
        technicianBadgeId: 'EB-TECH-1003',
        isActive: true
      }
    ]);

    await TechnicianProfile.create([
      {
        userId: tech1._id,
        technicianBadgeId: 'EB-TECH-1001',
        skills: ['power_outage', 'fuse_blown', 'voltage_fluctuation'],
        serviceAreas: ['Electronic City', 'Chandapura', 'Anekal'],
        isAvailable: true,
        // GeoJSON: [longitude, latitude] -> Electronic City (12.8452 N, 77.6602 E)
        location: { type: 'Point', coordinates: [77.6602, 12.8452] },
        lastLocationAt: new Date(),
        rating: 4.9
      },
      {
        userId: tech2._id,
        technicianBadgeId: 'EB-TECH-1002',
        skills: ['power_outage', 'meter_fault', 'sparking_or_exposed_wire'],
        serviceAreas: ['Anekal Town', 'Attibele', 'Jigani'],
        isAvailable: true,
        // GeoJSON: [longitude, latitude] -> Anekal (12.7109 N, 77.6953 E)
        location: { type: 'Point', coordinates: [77.6953, 12.7109] },
        lastLocationAt: new Date(),
        rating: 4.8
      },
      {
        userId: tech3._id,
        technicianBadgeId: 'EB-TECH-1003',
        skills: ['meter_fault', 'billing_or_connection', 'voltage_fluctuation'],
        serviceAreas: ['HSR Layout', 'Koramangala', 'Bommanahalli'],
        isAvailable: true,
        // GeoJSON: [longitude, latitude] -> HSR Layout (12.9121 N, 77.6446 E)
        location: { type: 'Point', coordinates: [77.6446, 12.9121] },
        lastLocationAt: new Date(),
        rating: 4.7
      }
    ]);

    // 4. Create Sample Complaints
    await Complaint.create([
      {
        customerId: customer1._id,
        problemType: 'power_outage',
        description: 'Complete phase outage across 3rd Cross since 10:30 AM. Neighbours also affected.',
        address: '42, 3rd Cross, Phase 1, Electronic City, Bengaluru',
        location: { type: 'Point', coordinates: [77.663, 12.8465] },
        status: 'pending',
        isHazardous: false,
        statusHistory: [
          {
            status: 'pending',
            changedBy: customer1._id,
            note: 'Initial power outage complaint logged'
          }
        ]
      },
      {
        customerId: customer1._id,
        problemType: 'voltage_fluctuation',
        description: 'Severe voltage dimming and flickering lights every evening between 6 PM and 9 PM.',
        address: '18, Main Road, Chandapura, Anekal Taluk',
        location: { type: 'Point', coordinates: [77.7021, 12.7985] },
        technicianId: tech1._id,
        status: 'accepted',
        isHazardous: false,
        statusHistory: [
          {
            status: 'pending',
            changedBy: customer1._id,
            note: 'Complaint created'
          },
          {
            status: 'assigned',
            changedBy: admin._id,
            note: 'Assigned to Karthik Murthy (EB-TECH-1001)'
          },
          {
            status: 'accepted',
            changedBy: tech1._id,
            note: 'Technician Karthik Murthy (EB-TECH-1001) confirmed availability and accepted request'
          }
        ]
      },
      {
        customerId: customer2._id,
        problemType: 'meter_fault',
        description: 'Digital smart meter LCD screen is blank and blinking red LED warning indicator.',
        address: '105, Jigani Industrial Area Road, Anekal',
        location: { type: 'Point', coordinates: [77.632, 12.781] },
        technicianId: tech2._id,
        status: 'resolved',
        isHazardous: false,
        statusHistory: [
          {
            status: 'pending',
            changedBy: customer2._id,
            note: 'Complaint created'
          },
          {
            status: 'accepted',
            changedBy: tech2._id,
            note: 'Technician accepted (EB-TECH-1002)'
          },
          {
            status: 'on_the_way',
            changedBy: tech2._id,
            note: 'En route to customer premises'
          },
          {
            status: 'in_progress',
            changedBy: tech2._id,
            note: 'Inspecting meter terminal block'
          },
          {
            status: 'resolved',
            changedBy: tech2._id,
            note: 'Loose neutral terminal tightened and display verified working'
          }
        ]
      }
    ]);

    console.log('\n============================================================');
    console.log('Smart EB Connect Database Seeded Successfully!');
    console.log('------------------------------------------------------------');
    console.log('Default Password for all accounts: Password123!');
    console.log('  Admin      : admin@smarteb.local');
    console.log('  Customer 1 : ananya@smarteb.local');
    console.log('  Customer 2 : rohan@smarteb.local');
    console.log('  Tech 1     : karthik.tech@smarteb.local [EB-TECH-1001] (Electronic City)');
    console.log('  Tech 2     : suresh.tech@smarteb.local [EB-TECH-1002] (Anekal)');
    console.log('  Tech 3     : prashanth.tech@smarteb.local [EB-TECH-1003] (HSR Layout)');
    console.log('============================================================\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('[Seed Failed]', err);
    process.exit(1);
  }
}

seedDatabase();
