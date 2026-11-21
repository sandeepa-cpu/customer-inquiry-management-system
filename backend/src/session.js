import session from 'express-session';

export const SESSION_COOKIE_NAME = 'cims.sid';
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;

function requireSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (typeof secret !== 'string' || secret.trim().length < MIN_SECRET_LENGTH) {
    throw new Error('SESSION_SECRET must be set to a string of at least 32 characters');
  }
  return secret;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function createSessionMiddleware() {
  return session({
    name: SESSION_COOKIE_NAME,
    secret: requireSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      ...sessionCookieOptions(),
      maxAge: EIGHT_HOURS_MS,
    },
  });
}

function sessionCallback(req, method) {
  return new Promise((resolve, reject) => {
    req.session[method]((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function regenerateSession(req) {
  return sessionCallback(req, 'regenerate');
}

export function saveSession(req) {
  return sessionCallback(req, 'save');
}

export function destroySession(req) {
  if (!req.session) {
    return Promise.resolve();
  }
  return sessionCallback(req, 'destroy');
}
