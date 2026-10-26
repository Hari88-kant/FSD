import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { TechnicianProfile } from '../src/models/TechnicianProfile.js';
import { Complaint } from '../src/models/Complaint.js';
import bcrypt from 'bcryptjs';

const TEST_DB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_eb_connect_test';

let customerAToken;
let customerBToken;
let tech1Token;
let tech2Token;
let adminToken;
let tech1Id;
let tech2Id;
let complaintId;

test.before(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Promise.all([
    User.deleteMany({}),
    TechnicianProfile.deleteMany({}),
    Complaint.deleteMany({})
  ]);

  // Seed admin directly (since public registration blocks admin role)
  const adminHash = await bcrypt.hash('AdminPass123!', 10);
  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin@test.local',
    passwordHash: adminHash,
    role: 'admin'
  });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.local', password: 'AdminPass123!' });
  adminToken = adminLogin.body.data.token;
  assert.ok(adminToken);
});

test.after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test('1. Health endpoint returns HTTP 200', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'ok');
});

test('2. Invalid registration/login is rejected with a safe error & admin self-registration is blocked', async () => {
  const badReg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'A', email: 'not-an-email', password: '123' });
  assert.equal(badReg.status, 400);
  assert.equal(badReg.body.success, false);
  assert.equal(badReg.body.error.code, 'VALIDATION_ERROR');

  const adminAttempt = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Fake Admin',
      email: 'fakeadmin@test.local',
      password: 'Password123!',
      role: 'admin'
    });
  assert.equal(adminAttempt.status, 400);
});

test('3. Passwords are stored hashed (never in plaintext) and customers/technicians can register', async () => {
  const custARes = await request(app).post('/api/auth/register').send({
    name: 'Customer A',
    email: 'custa@test.local',
    password: 'Password123!',
    role: 'customer'
  });
  assert.equal(custARes.status, 201);
  customerAToken = custARes.body.data.token;

  const custBRes = await request(app).post('/api/auth/register').send({
    name: 'Customer B',
    email: 'custb@test.local',
    password: 'Password123!',
    role: 'customer'
  });
  assert.equal(custBRes.status, 201);
  customerBToken = custBRes.body.data.token;

  // Verify passwordHash in MongoDB is bcrypt hashed
  const dbUser = await User.findOne({ email: 'custa@test.local' }).select('+passwordHash');
  assert.notEqual(dbUser.passwordHash, 'Password123!');
  assert.ok(dbUser.passwordHash.startsWith('$2'));

  // Register two technicians at known coordinates
  const tech1Res = await request(app).post('/api/auth/register').send({
    name: 'Tech Near (Electronic City)',
    email: 'tech1@test.local',
    password: 'Password123!',
    role: 'technician',
    lat: 12.8452,
    lng: 77.6602
  });
  assert.equal(tech1Res.status, 201);
  tech1Token = tech1Res.body.data.token;
  tech1Id = tech1Res.body.data.user.id;

  const tech2Res = await request(app).post('/api/auth/register').send({
    name: 'Tech Far (North Bengaluru)',
    email: 'tech2@test.local',
    password: 'Password123!',
    role: 'technician',
    lat: 13.1007,
    lng: 77.5963
  });
  assert.equal(tech2Res.status, 201);
  tech2Token = tech2Res.body.data.token;
  tech2Id = tech2Res.body.data.user.id;
});

test('4. Missing or denied GPS permission is handled gracefully (manual address fallback)', async () => {
  const res = await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${customerAToken}`)
    .send({
      problemType: 'power_outage',
      description: 'No power in apartment block since morning, GPS denied in browser.',
      address: 'Flat 202, Sunrise Enclave, Anekal'
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.complaint.status, 'pending');
  complaintId = res.body.data.complaint._id;
});

test('5. Customer cannot access another customer complaint', async () => {
  const res = await request(app)
    .get(`/api/complaints/${complaintId}`)
    .set('Authorization', `Bearer ${customerBToken}`);
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'FORBIDDEN');
});

test('6. Nearest technician results are sorted correctly using known sample coordinates', async () => {
  const res = await request(app)
    .get('/api/technicians/nearby?lat=12.8460&lng=77.6610&radiusKm=100')
    .set('Authorization', `Bearer ${customerAToken}`);
  assert.equal(res.status, 200);
  const techs = res.body.data.technicians;
  assert.equal(techs.length, 2);
  assert.equal(techs[0].technicianId, tech1Id);
  assert.ok(techs[0].distanceKm < techs[1].distanceKm);
});

test('7. Technician workflow: assign -> accept -> prevent double accept -> valid/invalid transitions', async () => {
  // Assign to tech1
  const assignRes = await request(app)
    .post(`/api/complaints/${complaintId}/assign`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ technicianId: tech1Id });
  assert.equal(assignRes.status, 200);
  assert.equal(assignRes.body.data.complaint.status, 'assigned');

  // Tech2 cannot accept complaint assigned to Tech1
  const wrongTechAccept = await request(app)
    .post(`/api/complaints/${complaintId}/accept`)
    .set('Authorization', `Bearer ${tech2Token}`);
  assert.equal(wrongTechAccept.status, 403);

  // Tech1 accepts
  const acceptRes = await request(app)
    .post(`/api/complaints/${complaintId}/accept`)
    .set('Authorization', `Bearer ${tech1Token}`);
  assert.equal(acceptRes.status, 200);
  assert.equal(acceptRes.body.data.complaint.status, 'accepted');

  // Double acceptance is rejected (409)
  const doubleAccept = await request(app)
    .post(`/api/complaints/${complaintId}/accept`)
    .set('Authorization', `Bearer ${tech1Token}`);
  assert.equal(doubleAccept.status, 409);

  // Invalid transition directly from accepted -> resolved is rejected
  const invalidTransition = await request(app)
    .patch(`/api/complaints/${complaintId}`)
    .set('Authorization', `Bearer ${tech1Token}`)
    .send({ status: 'resolved' });
  assert.equal(invalidTransition.status, 400);
  assert.equal(invalidTransition.body.error.code, 'INVALID_TRANSITION');

  // Valid transitions: accepted -> on_the_way -> in_progress -> resolved
  for (const nextStatus of ['on_the_way', 'in_progress', 'resolved']) {
    const stepRes = await request(app)
      .patch(`/api/complaints/${complaintId}`)
      .set('Authorization', `Bearer ${tech1Token}`)
      .send({ status: nextStatus, note: `Moved to ${nextStatus}` });
    assert.equal(stepRes.status, 200);
    assert.equal(stepRes.body.data.complaint.status, nextStatus);
  }
});

test('8. Admin routes reject non-admin users and allow admin summary', async () => {
  const forbiddenRes = await request(app)
    .get('/api/admin/summary')
    .set('Authorization', `Bearer ${customerAToken}`);
  assert.equal(forbiddenRes.status, 403);

  const okRes = await request(app)
    .get('/api/admin/summary')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(okRes.status, 200);
  assert.ok(okRes.body.data.counts.totalUsers >= 5);
});
