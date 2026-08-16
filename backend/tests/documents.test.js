const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const { setupDB } = require('./setup');
const User = require('../models/User');
const Case = require('../models/Case');
const Document = require('../models/Document');

setupDB();

describe('Documents API Endpoint Tests', () => {
  let lawyerToken, lawyerUser;
  let lawyer2Token, lawyer2User;
  let clientUser, legalCase;

  beforeEach(async () => {
    lawyerUser = await User.create({
      name: 'Doc Lawyer',
      email: 'doclawyer@test.com',
      password: 'password123',
      role: 'lawyer'
    });

    lawyer2User = await User.create({
      name: 'Doc Lawyer 2',
      email: 'doclawyer2@test.com',
      password: 'password123',
      role: 'lawyer'
    });

    clientUser = await User.create({
      name: 'Doc Client',
      email: 'docclient@test.com',
      password: 'password123',
      role: 'client'
    });

    legalCase = await Case.create({
      title: 'Document Testing Case',
      description: 'Case for document uploads',
      status: 'Open',
      lawyerId: lawyerUser._id,
      clientId: clientUser._id
    });

    const l1Login = await request(app).post('/api/auth/login').send({ email: 'doclawyer@test.com', password: 'password123' });
    lawyerToken = l1Login.body.token;

    const l2Login = await request(app).post('/api/auth/login').send({ email: 'doclawyer2@test.com', password: 'password123' });
    lawyer2Token = l2Login.body.token;
  });

  it('should upload a valid text document successfully', async () => {
    const res = await request(app)
      .post(`/api/documents/upload/${legalCase._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .attach('file', Buffer.from('Sample document content'), 'brief.txt');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('originalName', 'brief.txt');
    expect(res.body).toHaveProperty('version', 1);
  });

  it('should reject unsupported file types (e.g. .exe)', async () => {
    const res = await request(app)
      .post(`/api/documents/upload/${legalCase._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .attach('file', Buffer.from('binary data'), 'malicious.exe');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('should reject files exceeding 5MB size limit', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const res = await request(app)
      .post(`/api/documents/upload/${legalCase._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .attach('file', largeBuffer, 'huge_file.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('should bump document version when re-uploading under the same filename', async () => {
    // Version 1 upload
    const upload1 = await request(app)
      .post(`/api/documents/upload/${legalCase._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .attach('file', Buffer.from('Version 1 content'), 'contract.pdf');

    expect(upload1.status).toBe(201);
    expect(upload1.body.version).toBe(1);

    // Version 2 upload
    const upload2 = await request(app)
      .post(`/api/documents/upload/${legalCase._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .attach('file', Buffer.from('Version 2 updated content'), 'contract.pdf');

    expect(upload2.status).toBe(200);
    expect(upload2.body.version).toBe(2);
    expect(upload2.body.previousVersions.length).toBe(1);
    expect(upload2.body.previousVersions[0].version).toBe(1);
  });

  it('should return 403 Forbidden when an unauthorized user attempts to download document', async () => {
    const uploadRes = await request(app)
      .post(`/api/documents/upload/${legalCase._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .attach('file', Buffer.from('Private doc content'), 'private.txt');

    const docId = uploadRes.body._id;

    // Lawyer 2 attempts download
    const res = await request(app)
      .get(`/api/documents/download/${docId}`)
      .set('Authorization', `Bearer ${lawyer2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
