import bcrypt from 'bcrypt';
import { Router } from 'express';
import prisma from '../db.js';
import { publicUser } from '../lib/publicUser.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  SESSION_COOKIE_NAME,
  destroySession,
  regenerateSession,
  saveSession,
  sessionCookieOptions,
} from '../session.js';
import { loginSchema } from '../validation/auth.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const router = Router();

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordHash = user?.passwordHash ?? DUMMY_HASH;
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!user || !passwordMatches) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);

    res.status(200).json({ user: publicUser(user) });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await destroySession(req);
    clearSessionCookie(res);
    res.status(204).end();
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.status(200).json({ user: publicUser(user) });
  }),
);

export default router;
