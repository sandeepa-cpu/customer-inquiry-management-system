export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
