export function errorHandler(err, _req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  console.error('Request failed');
  res.status(500).json({ error: 'Internal server error' });
}
