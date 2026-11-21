import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/db.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Seed is disabled in production');
  process.exit(1);
}

const name = process.env.SEED_STAFF_NAME;
const email = process.env.SEED_STAFF_EMAIL;
const password = process.env.SEED_STAFF_PASSWORD;

if (!name || !email || !password) {
  console.error('SEED_STAFF_NAME, SEED_STAFF_EMAIL, and SEED_STAFF_PASSWORD are required');
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash },
  });

  console.log('Seeded staff account');
} catch {
  console.error('Seed failed');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
