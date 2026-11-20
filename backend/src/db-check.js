import 'dotenv/config';
import prisma from './db.js';

try {
  await prisma.$queryRaw`SELECT 1`;
  const userCount = await prisma.user.count();
  const inquiryCount = await prisma.inquiry.count();
  console.log(`Database connected. users=${userCount} inquiries=${inquiryCount}`);
} catch (err) {
  console.error('Database check failed');
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
