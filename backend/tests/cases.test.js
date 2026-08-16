const request = require('supertest');
const app = require('../server');
const { setupDB } = require('./setup');
const User = require('../models/User');
const Case = require('../models/Case');

setupDB();

describe('Cases API Endpoint Tests', () => {
  let lawyerToken, lawyerUser;
  let lawyer2Token, lawyer2User;
  let clientToken, clientUser;

  beforeEach(async () => {
    lawyerUser = await User.create({
      name: 'Lawyer One',
      email: 'lawyer1@test.com',
      password: 'password123',
      role: 'lawyer'
    });

    lawyer2User = await User.create({
      name: 'Lawyer Two',
      email: 'lawyer2@test.com',
      password: 'password123',
      role: 'lawyer'
    });

    clientUser = await User.create({
      name: 'Client One',
      email: 'client1@test.com',
      password: 'password123',
      role: 'client'
    });

    const l1Login = await request(app).post('/api/auth/login').send({ email: 'lawyer1@test.com', password: 'password123' });
    lawyerToken = l1Login.body.token;

    const l2Login = await request(app).post('/api/auth/login').send({ email: 'lawyer2@test.com', password: 'password123' });
    lawyer2Token = l2Login.body.token;

    const cLogin = await request(app).post('/api/auth/login').send({ email: 'client1@test.com', password: 'password123' });
    clientToken = cLogin.body.token;
  });

  it('should allow a lawyer to create a new case', async () => {
    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .send({
        title: 'Patent Infringement Defense',
        description: 'Defense against patent assertion entity',
        clientId: clientUser._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('title', 'Patent Infringement Defense');
    expect(res.body.lawyerId._id.toString()).toBe(lawyerUser._id.toString());
  });

  it('should reject case creation by a client with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Unauthorized Case',
        description: 'Should fail role check',
        clientId: clientUser._id.toString()
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 403 Forbidden when a lawyer tries to access another lawyer case', async () => {
    const case2 = await Case.create({
      title: 'Lawyer 2 Private Case',
      description: 'Private case details',
      status: 'Open',
      lawyerId: lawyer2User._id,
      clientId: clientUser._id
    });

    const res = await request(app)
      .get(`/api/cases/${case2._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should search, filter by status, and paginate cases correctly', async () => {
    await Case.create([
      { title: 'Alpha Case Title', description: 'Alpha description', status: 'Open', lawyerId: lawyerUser._id, clientId: clientUser._id },
      { title: 'Beta Case Title', description: 'Beta description', status: 'Active', lawyerId: lawyerUser._id, clientId: clientUser._id },
      { title: 'Gamma Case Title', description: 'Gamma description', status: 'Closed', lawyerId: lawyerUser._id, clientId: clientUser._id }
    ]);

    const res = await request(app)
      .get('/api/cases?page=1&limit=2&status=Open&search=Alpha')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cases');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.cases.length).toBe(1);
    expect(res.body.cases[0].title).toBe('Alpha Case Title');
  });

  it('should log audit trail activity and return timeline on /api/cases/:id/activity', async () => {
    const newCase = await Case.create({
      title: 'Activity Test Case',
      description: 'Test activity logs',
      status: 'Open',
      lawyerId: lawyerUser._id,
      clientId: clientUser._id
    });

    // Update status to generate activity log
    await request(app)
      .patch(`/api/cases/${newCase._id}/status`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .send({ status: 'Active' });

    const activityRes = await request(app)
      .get(`/api/cases/${newCase._id}/activity`)
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(activityRes.status).toBe(200);
    expect(Array.isArray(activityRes.body)).toBe(true);
    expect(activityRes.body.length).toBeGreaterThanOrEqual(1);
    expect(activityRes.body[0].action).toBe('STATUS_CHANGE');
  });

  it('should return analytics summary on /api/cases/analytics/summary', async () => {
    await Case.create({
      title: 'Analytics Case',
      description: 'Analytics case description',
      status: 'Open',
      lawyerId: lawyerUser._id,
      clientId: clientUser._id
    });

    const res = await request(app)
      .get('/api/cases/analytics/summary')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalCases');
    expect(res.body).toHaveProperty('statusBreakdown');
    expect(res.body.statusBreakdown.Open).toBe(1);
  });
});
