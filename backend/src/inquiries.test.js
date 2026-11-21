import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcrypt';
import request from 'supertest';

function assertLocalCimsDatabase() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is not set; tests require local database cims_db on port 5432');
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('DATABASE_URL is invalid; tests require local database cims_db on port 5432');
  }

  const host = parsed.hostname;
  const port = parsed.port || '5432';
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, '').split('/')[0]);

  if (
    (host !== 'localhost' && host !== '127.0.0.1') ||
    port !== '5432' ||
    database !== 'cims_db'
  ) {
    throw new Error('Tests must use local PostgreSQL database cims_db on port 5432');
  }
}

assertLocalCimsDatabase();

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.trim().length < 32) {
  process.env.SESSION_SECRET = 'cims-test-session-secret-value-32ch';
}

const { default: app } = await import('./app.js');
const { default: prisma } = await import('./db.js');

const testPassword = 'cims-4b-test-password';
const marker = randomUUID();
const staffAEmail = `cims-4b-${marker}-a@example.com`;
const staffBEmail = `cims-4b-${marker}-b@example.com`;
let staffAId;
let staffBId;

function assertNoPasswordHash(body) {
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes('passwordHash'), false);
}

function validCreateBody(overrides = {}) {
  return {
    customerName: `CIMS4B ${marker} Customer`,
    customerContact: 'customer@example.com',
    subject: `CIMS4B ${marker} Subject`,
    description: `CIMS4B ${marker} description`,
    ...overrides,
  };
}

async function loginAs(email) {
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').send({ email, password: testPassword });
  assert.equal(login.status, 200);
  return agent;
}

describe('inquiries', () => {
  before(async () => {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const [staffA, staffB] = await Promise.all([
      prisma.user.create({
        data: {
          name: `CIMS 4B Staff A ${marker}`,
          email: staffAEmail,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          name: `CIMS 4B Staff B ${marker}`,
          email: staffBEmail,
          passwordHash,
        },
      }),
    ]);
    staffAId = staffA.id;
    staffBId = staffB.id;
  });

  after(async () => {
    const testUserIds = [staffAId, staffBId].filter(Boolean);
    if (testUserIds.length > 0) {
      await prisma.inquiry.deleteMany({
        where: { createdById: { in: testUserIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }
    await prisma.$disconnect();
  });

  test('GET /api/health is public', async () => {
    const response = await request(app).get('/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
    assertNoPasswordHash(response.body);
  });

  test('unauthenticated access to all four inquiry endpoints is 401', async () => {
    const sampleId = randomUUID();
    const posts = await request(app).post('/api/inquiries').send(validCreateBody());
    const list = await request(app).get('/api/inquiries');
    const detail = await request(app).get(`/api/inquiries/${sampleId}`);
    const statusPatch = await request(app)
      .patch(`/api/inquiries/${sampleId}/status`)
      .send({ status: 'IN_PROGRESS' });

    assert.equal(posts.status, 401);
    assert.equal(posts.body.error, 'Unauthorized');
    assert.equal(list.status, 401);
    assert.equal(list.body.error, 'Unauthorized');
    assert.equal(detail.status, 401);
    assert.equal(detail.body.error, 'Unauthorized');
    assert.equal(statusPatch.status, 401);
    assert.equal(statusPatch.body.error, 'Unauthorized');
    assertNoPasswordHash(posts.body);
    assertNoPasswordHash(list.body);
    assertNoPasswordHash(detail.body);
    assertNoPasswordHash(statusPatch.body);
  });

  test('POST /api/inquiries creates with server-assigned NEW status and createdById', async () => {
    const agent = await loginAs(staffAEmail);
    const response = await agent.post('/api/inquiries').send(validCreateBody());

    assert.equal(response.status, 201);
    assert.equal(response.body.inquiry.status, 'NEW');
    assert.equal(response.body.inquiry.createdById, staffAId);
    assert.equal(response.body.inquiry.customerName, `CIMS4B ${marker} Customer`);
    assert.equal(response.body.inquiry.createdBy.email, staffAEmail);
    assert.equal('passwordHash' in (response.body.inquiry.createdBy ?? {}), false);
    assertNoPasswordHash(response.body);
  });

  test('POST /api/inquiries rejects invalid bodies', async () => {
    const agent = await loginAs(staffAEmail);
    const missing = await agent.post('/api/inquiries').send({ customerName: 'Only name' });
    const empty = await agent.post('/api/inquiries').send({
      customerName: '  ',
      customerContact: 'contact',
      subject: 'subject',
      description: 'description',
    });

    assert.equal(missing.status, 400);
    assert.equal(missing.body.error, 'Validation failed');
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error, 'Validation failed');
    assertNoPasswordHash(missing.body);
    assertNoPasswordHash(empty.body);
  });

  test('POST /api/inquiries rejects client-supplied status, createdById, and extra properties', async () => {
    const agent = await loginAs(staffAEmail);
    const beforeCount = await prisma.inquiry.count({
      where: { createdById: { in: [staffAId, staffBId] } },
    });

    const withStatus = await agent.post('/api/inquiries').send(
      validCreateBody({ status: 'RESOLVED' }),
    );
    const withCreatedBy = await agent.post('/api/inquiries').send(
      validCreateBody({ createdById: staffBId }),
    );
    const withExtra = await agent.post('/api/inquiries').send(validCreateBody({ id: randomUUID() }));

    assert.equal(withStatus.status, 400);
    assert.equal(withStatus.body.error, 'Validation failed');
    assert.equal(withCreatedBy.status, 400);
    assert.equal(withExtra.status, 400);

    const afterCount = await prisma.inquiry.count({
      where: { createdById: { in: [staffAId, staffBId] } },
    });
    assert.equal(afterCount, beforeCount);
    assertNoPasswordHash(withStatus.body);
  });

  test('GET /api/inquiries searches by customer name or subject, not description only', async () => {
    const agent = await loginAs(staffAEmail);
    const nameToken = `name-${marker}`;
    const subjectToken = `subj-${marker}`;
    const descToken = `desc-only-${marker}`;

    await agent.post('/api/inquiries').send(
      validCreateBody({
        customerName: `Cust ${nameToken}`,
        subject: `Other ${marker}`,
        description: `plain ${marker}`,
      }),
    );
    await agent.post('/api/inquiries').send(
      validCreateBody({
        customerName: `Other ${marker}`,
        subject: `About ${subjectToken}`,
        description: `plain ${marker}`,
      }),
    );
    await agent.post('/api/inquiries').send(
      validCreateBody({
        customerName: `Hidden ${marker}`,
        subject: `Hidden ${marker}`,
        description: descToken,
      }),
    );

    const byName = await agent.get('/api/inquiries').query({ q: nameToken });
    const bySubject = await agent.get('/api/inquiries').query({ q: subjectToken });
    const byDescription = await agent.get('/api/inquiries').query({ q: descToken });

    assert.equal(byName.status, 200);
    assert.equal(byName.body.inquiries.length, 1);
    assert.match(byName.body.inquiries[0].customerName, new RegExp(nameToken));

    assert.equal(bySubject.status, 200);
    assert.equal(bySubject.body.inquiries.length, 1);
    assert.match(bySubject.body.inquiries[0].subject, new RegExp(subjectToken));

    assert.equal(byDescription.status, 200);
    assert.equal(byDescription.body.inquiries.length, 0);
    assertNoPasswordHash(byName.body);
  });

  test('GET /api/inquiries combines search and status filter', async () => {
    const agent = await loginAs(staffAEmail);
    const combo = `combo-${marker}`;

    const created = await agent.post('/api/inquiries').send(
      validCreateBody({
        customerName: `Combo ${combo}`,
        subject: `Combo subject ${marker}`,
      }),
    );
    assert.equal(created.status, 201);

    const other = await agent.post('/api/inquiries').send(
      validCreateBody({
        customerName: `Combo ${combo} other`,
        subject: `Combo other ${marker}`,
      }),
    );
    await agent
      .patch(`/api/inquiries/${other.body.inquiry.id}/status`)
      .send({ status: 'IN_PROGRESS' });

    const combined = await agent.get('/api/inquiries').query({ q: combo, status: 'NEW' });
    assert.equal(combined.status, 200);
    assert.ok(combined.body.inquiries.every((item) => item.status === 'NEW'));
    assert.ok(combined.body.inquiries.every((item) => item.customerName.includes(combo)));
    assert.equal(combined.body.inquiries.length, 1);
    assert.equal(combined.body.inquiries[0].id, created.body.inquiry.id);
    assertNoPasswordHash(combined.body);
  });

  test('staff B can list, view, and update staff A inquiry status', async () => {
    const agentA = await loginAs(staffAEmail);
    const created = await agentA.post('/api/inquiries').send(validCreateBody());
    assert.equal(created.status, 201);
    const inquiryId = created.body.inquiry.id;

    const agentB = await loginAs(staffBEmail);
    const list = await agentB.get('/api/inquiries').query({ q: marker });
    assert.equal(list.status, 200);
    assert.ok(list.body.inquiries.some((item) => item.id === inquiryId));

    const detail = await agentB.get(`/api/inquiries/${inquiryId}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.inquiry.createdById, staffAId);

    const patched = await agentB
      .patch(`/api/inquiries/${inquiryId}/status`)
      .send({ status: 'IN_PROGRESS' });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.inquiry.status, 'IN_PROGRESS');
    assertNoPasswordHash(detail.body);
    assertNoPasswordHash(patched.body);
  });

  test('PATCH /api/inquiries/:id/status allows any direction including reopen', async () => {
    const agent = await loginAs(staffAEmail);
    const created = await agent.post('/api/inquiries').send(validCreateBody());
    const id = created.body.inquiry.id;

    const inProgress = await agent.patch(`/api/inquiries/${id}/status`).send({ status: 'IN_PROGRESS' });
    const resolved = await agent.patch(`/api/inquiries/${id}/status`).send({ status: 'RESOLVED' });
    const reopened = await agent.patch(`/api/inquiries/${id}/status`).send({ status: 'NEW' });
    const invalid = await agent.patch(`/api/inquiries/${id}/status`).send({ status: 'CLOSED' });

    assert.equal(inProgress.status, 200);
    assert.equal(inProgress.body.inquiry.status, 'IN_PROGRESS');
    assert.equal(resolved.status, 200);
    assert.equal(resolved.body.inquiry.status, 'RESOLVED');
    assert.equal(reopened.status, 200);
    assert.equal(reopened.body.inquiry.status, 'NEW');
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.error, 'Validation failed');
    assertNoPasswordHash(reopened.body);
  });

  test('GET and PATCH status reject malformed ids and missing inquiries', async () => {
    const agent = await loginAs(staffAEmail);
    const missingId = randomUUID();

    const badGet = await agent.get('/api/inquiries/not-a-uuid');
    const missingGet = await agent.get(`/api/inquiries/${missingId}`);
    const badPatch = await agent.patch('/api/inquiries/not-a-uuid/status').send({ status: 'NEW' });
    const missingPatch = await agent
      .patch(`/api/inquiries/${missingId}/status`)
      .send({ status: 'NEW' });

    assert.equal(badGet.status, 400);
    assert.equal(badGet.body.error, 'Validation failed');
    assert.equal(missingGet.status, 404);
    assert.equal(missingGet.body.error, 'Not found');
    assert.equal(badPatch.status, 400);
    assert.equal(badPatch.body.error, 'Validation failed');
    assert.equal(missingPatch.status, 404);
    assert.equal(missingPatch.body.error, 'Not found');
    assertNoPasswordHash(missingGet.body);
  });
});
