const { PrismaClient } = require('@prisma/client');

let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.error('💥 [DATABASE INITIALIZATION ERROR] Prisma client failed to initialize:', e.message);
}

// Relational API Query Interface that wraps Prisma Client
const db = {
  isSandbox: () => false,
  getPrisma: () => prisma,
  connectDb: async () => {
    if (!prisma) return false;
    try {
      console.log('🔌 Verifying live PostgreSQL database connectivity...');
      await prisma.$connect();
      await prisma.$executeRawUnsafe('SELECT 1;');
      console.log('⚡ Connected successfully to PostgreSQL database.');
      return true;
    } catch (err) {
      console.error(`💥 Database connection check failed: ${err.message}`);
      return false;
    }
  },
  ping: async () => {
    try {
      if (!prisma) return { connected: false, error: 'Prisma Client not initialized' };
      await prisma.$executeRawUnsafe('SELECT 1;');
      return { connected: true };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  },
  transaction: async (fn, options = {}) => {
    const maxAttempts = 3;
    let attempt = 1;

    while (true) {
      try {
        return await prisma.$transaction(async (tx) => {
          return await fn(tx);
        }, options);
      } catch (err) {
        console.error(`💥 [DATABASE TRANSACTION ERROR] (Attempt ${attempt}/${maxAttempts}): ${err.message}`);

        const isTransientConnection = 
          err.message?.toLowerCase().includes('connection') || 
          err.message?.toLowerCase().includes('pool') ||
          err.message?.toLowerCase().includes('socket') ||
          err.code === 'P1001' ||
          err.code === 'P1002' ||
          err.code === 'P1008' ||
          err.code === 'P2024';

        if (isTransientConnection && attempt < maxAttempts) {
          const backoff = attempt * attempt * 200;
          console.warn(`⚠️ [JK Database] Transient transaction connection error. Retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          attempt++;
          continue;
        }

        throw err;
      }
    }
  }
};

const activeModels = [
  'user',
  'session',
  'serviceArea',
  'service',
  'servicePartner',
  'promoCode',
  'booking',
  'bookingItem',
  'review',
  'notification',
  'auditLog',
  'address',
  'waitlist',
  'emailLog',
  'bookingStatusHistory',
  'partnerPerformance',
  'revenueData'
];

activeModels.forEach(modelName => {
  db[modelName] = {};
  const prismaModel = prisma[modelName];
  if (!prismaModel) {
    console.error(`💥 Prisma Model ${modelName} not found on Prisma Client instance!`);
    return;
  }

  const methods = [
    'findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete',
    'updateMany', 'deleteMany', 'count', 'aggregate', 'upsert'
  ];

  methods.forEach(methodName => {
    if (typeof prismaModel[methodName] !== 'function') return;

    db[modelName][methodName] = async function(...args) {
      const maxAttempts = 3;
      let attempt = 1;

      while (true) {
        try {
          return await prismaModel[methodName].apply(prismaModel, args);
        } catch (err) {
          console.error(`💥 [DATABASE QUERY ERROR] Exception during ${modelName}.${methodName} (Attempt ${attempt}/${maxAttempts}): ${err.message}`);

          const isTransientConnection = 
            err.message?.toLowerCase().includes('connection') || 
            err.message?.toLowerCase().includes('pool') ||
            err.message?.toLowerCase().includes('socket') ||
            err.code === 'P1001' ||
            err.code === 'P1002' ||
            err.code === 'P1008' ||
            err.code === 'P2024';

          if (isTransientConnection && attempt < maxAttempts) {
            const backoff = attempt * attempt * 200;
            console.warn(`⚠️ [JK Database] Transient connection error on ${modelName}.${methodName}. Retrying in ${backoff}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            attempt++;
            continue;
          }

          throw err;
        }
      }
    };
  });
});

// Stubs for deprecated/removed models to prevent legacy route crashes
const stubMethod = (fallbackValue) => async () => {
  return fallbackValue;
};

db.customer = {
  findUnique: stubMethod(null),
  findFirst: stubMethod(null),
  findMany: stubMethod([]),
  create: stubMethod({}),
  update: stubMethod({}),
  delete: stubMethod({})
};

db.worker = {
  findUnique: stubMethod(null),
  findFirst: stubMethod(null),
  findMany: stubMethod([]),
  create: stubMethod({}),
  update: stubMethod({}),
  delete: stubMethod({})
};

db.workerSkill = {
  findUnique: stubMethod(null),
  findFirst: stubMethod(null),
  findMany: stubMethod([]),
  create: stubMethod({}),
  deleteMany: stubMethod({ count: 0 })
};

module.exports = db;
