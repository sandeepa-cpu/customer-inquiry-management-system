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

const testPassword = 'cims-test-password';
const testEmail = `cims-test-${randomUUID()}@example.com`;
let testUserId;

function assertNoPasswordHash(body) {
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes('passwordHash'), false);
}

describe('auth', () => {
  before(async () => {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: 'CIMS Test User',
        email: testEmail,
        passwordHash,
      },
    });
    testUserId = user.id;
  });

  after(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test('GET /api/health is public', async () => {
    const response = await request(app).get('/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
    assertNoPasswordHash(response.body);
  });

  test('POST /api/auth/login rejects invalid input', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, 'Validation failed');
    assertNoPasswordHash(response.body);
  });

  test('POST /api/auth/login rejects unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: `missing-${randomUUID()}@example.com`, password: testPassword });
    assert.equal(response.status, 401);
    assert.equal(response.body.error, 'Invalid credentials');
    assertNoPasswordHash(response.body);
  });

  test('POST /api/auth/login rejects wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrong-password' });
    assert.equal(response.status, 401);
    assert.equal(response.body.error, 'Invalid credentials');
    assertNoPasswordHash(response.body);
  });

  test('GET /api/auth/me without a session is unauthorized', async () => {
    const response = await request(app).get('/api/auth/me');
    assert.equal(response.status, 401);
    assert.equal(response.body.error, 'Unauthorized');
    assertNoPasswordHash(response.body);
  });

  test('POST /api/auth/logout is public and idempotent', async () => {
    const response = await request(app).post('/api/auth/logout');
    assert.equal(response.status, 204);
    assert.equal(response.text, '');
  });

  test('login sets a session, /me persists, logout clears it', async () => {
    const agent = request.agent(app);

    const login = await agent
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    assert.equal(login.status, 200);
    assert.equal(login.body.user.email, testEmail);
    assert.equal(login.body.user.name, 'CIMS Test User');
    assert.equal(typeof login.body.user.id, 'string');
    assert.equal('passwordHash' in login.body.user, false);
    assertNoPasswordHash(login.body);
    assert.match(login.headers['set-cookie']?.join(';') ?? '', /cims\.sid=/);

    const me = await agent.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.user.id, testUserId);
    assert.equal(me.body.user.email, testEmail);
    assert.equal('passwordHash' in me.body.user, false);
    assertNoPasswordHash(me.body);

    const logout = await agent.post('/api/auth/logout');
    assert.equal(logout.status, 204);

    const meAfterLogout = await agent.get('/api/auth/me');
    assert.equal(meAfterLogout.status, 401);
    assert.equal(meAfterLogout.body.error, 'Unauthorized');
    assertNoPasswordHash(meAfterLogout.body);
  });
});
