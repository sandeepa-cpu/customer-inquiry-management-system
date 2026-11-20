import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  } else {
    console.error('Failed to start server', err);
  }
  process.exit(1);
});
