const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Applying status index...');
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_booking_status" ON "Booking"("status");`);
    
    console.log('Applying createdAt index...');
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_booking_createdAt" ON "Booking"("createdAt");`);
    
    console.log('Database indexes applied successfully to Neon PostgreSQL.');
  } catch (error) {
    console.error('Error applying indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
