const request = require('supertest');
const app = require('../server');
const { setupDB } = require('./setup');
const User = require('../models/User');

setupDB();

describe('Auth API Endpoint Tests', () => {
  it('should register a new lawyer successfully with a valid password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Lawyer',
        email: 'lawyer@test.com',
        password: 'Password123',
        role: 'lawyer'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'lawyer@test.com');
  });

  it('should reject registration with a weak password (too short)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short PW',
        email: 'short@test.com',
        password: 'short',
        role: 'lawyer'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject registration with a password lacking numeric digits', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'No Number PW',
        email: 'nonum@test.com',
        password: 'passwordOnly',
        role: 'lawyer'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should login an existing user with correct credentials', async () => {
    const user = new User({
      name: 'Existing User',
      email: 'login@test.com',
      password: 'password123',
      role: 'client'
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@test.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'login@test.com');
  });

  it('should fail login with invalid password', async () => {
    const user = new User({
      name: 'Existing User',
      email: 'wrongpw@test.com',
      password: 'password123',
      role: 'client'
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrongpw@test.com',
        password: 'incorrectPassword'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 500 when JWT_SECRET is missing at login time', async () => {
    const originalEnv = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    // Register a user first so we have a valid account to attempt login against
    await request(app).post('/api/auth/register').send({
      name: 'JWT Guard Test',
      email: 'jwtguard@test.com',
      password: 'secure123',
      role: 'client'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'jwtguard@test.com',
      password: 'secure123'
    });

    // Restore before asserting so teardown works correctly
    process.env.JWT_SECRET = originalEnv;

    expect(res.status).toBe(500);
    expect(res.body.error.message).toMatch(/JWT_SECRET/);
  });
});
