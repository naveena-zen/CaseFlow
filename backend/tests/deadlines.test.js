const request = require('supertest');
const app = require('../server');
const { setupDB } = require('./setup');
const User = require('../models/User');
const Case = require('../models/Case');
const Deadline = require('../models/Deadline');
const { checkAndSendReminders } = require('../services/reminderService');

setupDB();

describe('Deadlines API & Reminders Tests', () => {
  let lawyerToken, lawyerUser;
  let lawyer2Token, lawyer2User;
  let clientUser, legalCase;

  beforeEach(async () => {
    lawyerUser = await User.create({
      name: 'Deadline Lawyer',
      email: 'deadlinelawyer@test.com',
      password: 'password123',
      role: 'lawyer'
    });

    lawyer2User = await User.create({
      name: 'Deadline Lawyer 2',
      email: 'deadlinelawyer2@test.com',
      password: 'password123',
      role: 'lawyer'
    });

    clientUser = await User.create({
      name: 'Deadline Client',
      email: 'deadlineclient@test.com',
      password: 'password123',
      role: 'client'
    });

    legalCase = await Case.create({
      title: 'Deadline Testing Case',
      description: 'Case for deadlines',
      status: 'Open',
      lawyerId: lawyerUser._id,
      clientId: clientUser._id
    });

    const l1Login = await request(app).post('/api/auth/login').send({ email: 'deadlinelawyer@test.com', password: 'password123' });
    lawyerToken = l1Login.body.token;

    const l2Login = await request(app).post('/api/auth/login').send({ email: 'deadlinelawyer2@test.com', password: 'password123' });
    lawyer2Token = l2Login.body.token;
  });

  it('should allow a lawyer to create a deadline for a case', async () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post(`/api/deadlines/${legalCase._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .send({
        title: 'Submit Expert Witness Report',
        dueDate: futureDate
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('title', 'Submit Expert Witness Report');
  });

  it('should return 403 Forbidden when unauthorized lawyer attempts to update deadline', async () => {
    const deadline = await Deadline.create({
      caseId: legalCase._id,
      title: 'Confidential Hearing Prep',
      dueDate: new Date()
    });

    const res = await request(app)
      .put(`/api/deadlines/${deadline._id}`)
      .set('Authorization', `Bearer ${lawyer2Token}`)
      .send({
        title: 'Unauthorized Modification',
        dueDate: new Date().toISOString()
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should run deadline reminder check without crashing', async () => {
    // Create a deadline due in 3 days
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await Deadline.create({
      caseId: legalCase._id,
      title: 'Upcoming Motions Filing',
      dueDate: threeDaysFromNow
    });

    const result = await checkAndSendReminders();
    expect(result).toHaveProperty('sentCount');
    expect(result.sentCount).toBeGreaterThanOrEqual(1);
  });
});
