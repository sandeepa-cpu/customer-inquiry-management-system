import prisma from '../db.js';
import { SESSION_COOKIE_NAME, destroySession, sessionCookieOptions } from '../session.js';

export async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true },
    });

    if (!user) {
      await destroySession(req);
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
