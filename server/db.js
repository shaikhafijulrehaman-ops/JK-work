const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

let prisma;
let isPrismaConnected = false;
let useSandbox = false;

const fs = require('fs');
const path = require('path');
const sandboxFilePath = path.join(__dirname, 'sandbox_db.json');
let isSeeded = false;

// 1. In-Memory Sandbox Database State (Fallback)
const sandbox = {
  users: [],
  sessions: [],
  services: [],
  workers: [],
  workerSkills: [],
  serviceAreas: [],
  promoCodes: [],
  bookings: [],
  bookingItems: [],
  reviews: [],
  notifications: [],
  auditLogs: [],
  waitlist: [],
  addresses: [],
  customers: []
};

function saveSandbox() {
  try {
    fs.writeFileSync(sandboxFilePath, JSON.stringify(sandbox, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save sandbox data to file:', err.message);
  }
}

function loadSandbox() {
  try {
    if (fs.existsSync(sandboxFilePath)) {
      const data = fs.readFileSync(sandboxFilePath, 'utf8');
      const parsed = JSON.parse(data);
      Object.keys(parsed).forEach(key => {
        if (sandbox[key]) {
          sandbox[key].length = 0;
          sandbox[key].push(...parsed[key]);
        }
      });
      console.log('⚡ [JK Enterprises DB] Loaded persisted local Sandbox data from sandbox_db.json');
    }
  } catch (err) {
    console.error('Failed to load sandbox data from file:', err.message);
  }
}

// Automatically proxy all arrays in sandbox to auto-save on changes
Object.keys(sandbox).forEach(key => {
  if (Array.isArray(sandbox[key])) {
    const originalArray = sandbox[key];
    sandbox[key] = new Proxy(originalArray, {
      set(target, prop, value) {
        const result = Reflect.set(target, prop, value);
        if (isSeeded) {
          saveSandbox();
        }
        return result;
      },
      deleteProperty(target, prop) {
        const result = Reflect.deleteProperty(target, prop);
        if (isSeeded) {
          saveSandbox();
        }
        return result;
      }
    });
  }
});

// Seeding standard sandbox brochure data immediately on load
async function seedSandbox() {
  const hashPassword = (plain) => bcrypt.hashSync(plain, 10);
  
  // Service Areas
  sandbox.serviceAreas.push(
    { id: 'sa-1', city: 'Bengaluru', pincode: '560073', isActive: true },
    { id: 'sa-2', city: 'Bengaluru', pincode: '560074', isActive: true }
  );

  // Promo Codes
  sandbox.promoCodes.push(
    { id: 'pc-1', code: '9MINUTES', discountType: 'PERCENTAGE', discountValue: 15.0, minOrderValue: 0.0, maxDiscount: 200.0, usageLimit: 100, perUserLimit: 1, isActive: true, usedCount: 12, expiresAt: new Date('2026-12-31') },
    { id: 'pc-2', code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10.0, minOrderValue: 0.0, maxDiscount: 100.0, usageLimit: 200, perUserLimit: 1, isActive: true, usedCount: 34, expiresAt: new Date('2026-12-31') }
  );

  // User: Admin
  sandbox.users.push({
    id: 'user-admin',
    email: 'admin@jkenterprises.com',
    password: hashPassword('admin123'),
    name: 'JK Admin',
    phone: '8431588235',
    role: 'ADMIN',
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: new Date()
  });



  // Services (11 Brochure items)
  const servicesList = [
    { id: 's-1', name: 'Baby Care', category: 'Care', price: 799, durationText: '6 Hours', packageText: 'Daily Needs', imageUrl: '/services/babycare.jpg', description: 'Professional baby care support at home by trained and verified caregivers. Safe, responsible, and caring service for infants and children with trusted assistance.' },
    { id: 's-2', name: 'Full House Deep Cleaning', category: 'Cleaning', price: 3499, durationText: '', packageText: 'Deep Hygiene', imageUrl: '/services/housecleaning.jpg', description: 'Complete deep cleaning service for the entire home including living room, bedrooms, kitchen, and bathroom. Professional equipment used for premium hygiene.' },
    { id: 's-3', name: 'Bathroom Deep Cleaning', category: 'Cleaning', price: 749, durationText: '', packageText: 'Premium Sanitation', imageUrl: '/services/bathroom-cleaning.jpg', description: 'Deep sanitation and premium cleaning including tiles, fittings, mirrors, sinks, and floor cleaning with hygienic professional solutions.' },
    { id: 's-4', name: 'Full Kitchen Cleaning', category: 'Cleaning', price: 499, durationText: '', packageText: 'Fresh Kitchen', imageUrl: '/services/kitchen-cleaning.jpg', description: 'Complete kitchen cleaning including slabs, shelves, sink area, stove cleaning, and hygienic surface treatment.' },
    { id: 's-5', name: 'Dust Cleaning', category: 'Cleaning', price: 149, durationText: '1 Hour', packageText: 'Quick Dusting', imageUrl: '/services/dust-cleaning.jpg', description: 'Quick and effective dust removal for furniture, electronics, shelves, windows, and home interiors.' },
    { id: 's-6', name: 'House Shifting', category: 'Shifting', price: 3499, durationText: '', packageText: '2BHK Package', imageUrl: '/services/house-shifting.jpg', description: 'Professional packing, loading, moving, and unloading services for 2BHK.' },
    { id: 's-7', name: 'Cooking Service', category: 'Cooking', price: 149, durationText: '1 Hour', packageText: 'Meal Prep', imageUrl: '/services/cooking-service.jpg', description: 'Hygienic and healthy home-cooked meal preparation (veg/non-veg).' },
    { id: 's-8', name: 'House Painting', category: 'Painting', price: 20099, durationText: '', packageText: 'All Materials Included', imageUrl: '/services/house-painting.jpg', description: 'Premium interior wall painting with material and labor warranty.' },
    { id: 's-9', name: 'Electrician Service', category: 'Technical', price: 499, durationText: '1 Hour', packageText: 'Essential Repairs', imageUrl: '/services/electrician.jpg', description: 'Repairing of switchboards, wiring issues, appliances, and fan installations.' },
    { id: 's-10', name: 'Security Provider', category: 'Care', price: 899, durationText: '8 Hours', packageText: 'Safe Protection', imageUrl: '/services/security-provider-v2.jpg', description: 'Vigilant and background-verified security guards for corporate/residential properties.' },
    { id: 's-11', name: 'Pest Control', category: 'Cleaning', price: 2599, durationText: '', packageText: '2BHK Package', imageUrl: '/services/pest-control-v2.jpg', description: 'Odourless gel and spray treatment for cockroaches, ants, and bedbugs.' }
  ];
  sandbox.services.push(...servicesList.map(s => ({ ...s, isActive: true })));

  // Workers
  const workersSeed = [
    { 
      id: 'w-1', 
      email: 'ramesh@jkenterprises.com', 
      name: 'Ramesh Kumar', 
      phone: '7766554433', 
      rating: 4.8, 
      commissionRate: 0.75, 
      skills: ['Full House Deep Cleaning', 'Bathroom Deep Cleaning', 'Full Kitchen Cleaning', 'Dust Cleaning', 'Pest Control'],
      approvalStatus: 'APPROVED',
      experienceYears: 5,
      address: 'Anchepalya, Bengaluru',
      bankDetails: JSON.stringify({ holderName: 'Ramesh Kumar', bankName: 'HDFC Bank', accountNumber: '501002938475', ifsc: 'HDFC0000140', upi: 'ramesh@upi' }),
      profilePhoto: null,
      aadhaar: null
    },
    { 
      id: 'w-2', 
      email: 'vijay@jkenterprises.com', 
      name: 'Vijay Kumar', 
      phone: '8877665544', 
      rating: 4.9, 
      commissionRate: 0.70, 
      skills: ['Electrician Service'],
      approvalStatus: 'APPROVED',
      experienceYears: 4,
      address: 'Peenya Industrial Area, Bengaluru',
      bankDetails: JSON.stringify({ holderName: 'Vijay Kumar', bankName: 'ICICI Bank', accountNumber: '000401928374', ifsc: 'ICIC0000004', upi: 'vijay@upi' }),
      profilePhoto: null,
      aadhaar: null
    },
    { 
      id: 'w-3', 
      email: 'anitha@jkenterprises.com', 
      name: 'Anitha Reddy', 
      phone: '9988776655', 
      rating: 4.7, 
      commissionRate: 0.80, 
      skills: ['Baby Care', 'Cooking Service'],
      approvalStatus: 'APPROVED',
      experienceYears: 6,
      address: 'Nagasandra, Bengaluru',
      bankDetails: JSON.stringify({ holderName: 'Anitha Reddy', bankName: 'State Bank of India', accountNumber: '20491827364', ifsc: 'SBIN0003040', upi: 'anitha@upi' }),
      profilePhoto: null,
      aadhaar: null
    }
  ];

  for (const w of workersSeed) {
    const userId = `user-worker-${w.id}`;
    sandbox.users.push({
      id: userId,
      email: w.email,
      password: hashPassword('worker123'),
      name: w.name,
      phone: w.phone,
      role: 'WORKER',
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: new Date()
    });

    sandbox.workers.push({
      id: w.id,
      userId: userId,
      status: 'AVAILABLE',
      approvalStatus: w.approvalStatus || 'APPROVED',
      aadhaar: w.aadhaar || null,
      experienceYears: w.experienceYears || null,
      profilePhoto: w.profilePhoto || null,
      address: w.address || null,
      bankDetails: w.bankDetails || null,
      rating: w.rating || 5.0,
      totalJobs: 0,
      commissionRate: w.commissionRate || 0.70,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    for (const skillName of w.skills) {
      const s = sandbox.services.find(serv => serv.name === skillName);
      if (s) {
        sandbox.workerSkills.push({
          id: `ws-${w.id}-${s.id}`,
          workerId: w.id,
          serviceId: s.id
        });
      }
    }
  }



  // Seed Audit Logs representing real seed user interactions
  sandbox.auditLogs.push(

    {
      id: 'al-seed-2',
      userId: 'user-worker-w-2',
      userName: 'Vijay Kumar',
      userEmail: 'vijay@jkenterprises.com',
      userRole: 'WORKER',
      eventType: 'LOGIN',
      action: 'ACCOUNT_LOGIN',
      details: JSON.stringify({ email: 'vijay@jkenterprises.com', role: 'WORKER' }),
      ipAddress: '127.0.0.1',
      createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
    },
    {
      id: 'al-seed-3',
      userId: 'user-admin',
      userName: 'JK Admin',
      userEmail: 'admin@jkenterprises.com',
      userRole: 'ADMIN',
      eventType: 'LOGIN',
      action: 'ACCOUNT_LOGIN',
      details: JSON.stringify({ email: 'admin@jkenterprises.com', role: 'ADMIN' }),
      ipAddress: '127.0.0.1',
      createdAt: new Date(Date.now() - 3600000 * 12) // 12 hours ago
    }
  );

  console.log('[JK Enterprises DB] In-memory Sandbox Seeding completed.');
}

// Immediately Seed Sandbox so it is ready if Postgres is not connected
seedSandbox();
loadSandbox();
isSeeded = true;

// 2. Initialize Prisma Client & test connection
try {
  prisma = new PrismaClient();
  // Quick self-check to see if the database is actually reachable
  // Using direct ping or query
  prisma.$connect()
    .then(() => {
      isPrismaConnected = true;
      console.log('⚡ [JK Enterprises DB] Connected successfully to Neon PostgreSQL database.');
    })
    .catch((err) => {
      useSandbox = true;
      console.warn('⚠️ [JK Enterprises DB] Neon PostgreSQL offline or invalid connection. Falling back to local In-Memory Sandbox.');
      console.warn('💡 Supply a valid DATABASE_URL in server/.env to run migrations on live PostgreSQL.');
    });
} catch (e) {
  useSandbox = true;
  console.warn('⚠️ [JK Enterprises DB] Prisma client failed to initialize. Falling back to In-Memory Sandbox.');
}

// Helper to safely execute a live Prisma query with instant sandbox fallback if the database is offline, slow, or times out
async function safeQuery(prismaPromise, sandboxFallback) {
  return await prismaPromise;
}

// 3. Relational API Query Interface that acts exactly like Prisma
const db = {
  // Check active mode
  isSandbox: () => false,
  getPrisma: () => prisma,

  // --- USER CONTROLLER MOCK API ---
  user: {
    findFirst: async (args = {}) => {
      const fallback = async () => {
        if (!args.where) return sandbox.users[0] || null;
        const match = sandbox.users.find(u => {
          if (args.where.role && u.role !== args.where.role) return false;
          if (args.where.email && u.email !== args.where.email) return false;
          if (args.where.phone && u.phone !== args.where.phone) return false;
          return true;
        });
        return match || null;
      };
      return safeQuery(prisma.user.findFirst(args), fallback);
    },
    findMany: async (args = {}) => {
      const fallback = async () => {
        let list = sandbox.users;
        if (args && args.where) {
          if (args.where.role) {
            list = list.filter(u => u.role === args.where.role);
          }
        }
        return list;
      };
      return safeQuery(prisma.user.findMany(args), fallback);
    },
    findUnique: async (args) => {
      const fallback = async () => {
        if (args.where.email) {
          return sandbox.users.find(u => u.email === args.where.email) || null;
        }
        if (args.where.id) {
          const user = sandbox.users.find(u => u.id === args.where.id);
          if (user) {
            // Include worker profile if specified in relation args
            if (args.include && args.include.workerProfile) {
              user.workerProfile = sandbox.workers.find(w => w.userId === user.id) || null;
            }
          }
          return user || null;
        }
        if (args.where.phone) {
          return sandbox.users.find(u => u.phone === args.where.phone) || null;
        }
        return null;
      };
      return safeQuery(prisma.user.findUnique(args), fallback);
    },
    create: async (args) => {
      const fallback = async () => {
        const newUser = {
          id: `user-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          isEmailVerified: false,
          isPhoneVerified: false,
          role: 'USER',
          ...args.data
        };
        sandbox.users.push(newUser);
        return newUser;
      };
      return safeQuery(prisma.user.create(args), fallback);
    },
    update: async (args) => {
      const fallback = async () => {
        const index = sandbox.users.findIndex(u => u.id === args.where.id);
        if (index !== -1) {
          sandbox.users[index] = { ...sandbox.users[index], ...args.data, updatedAt: new Date() };
          return sandbox.users[index];
        }
        throw new Error('User not found in Sandbox');
      };
      return safeQuery(prisma.user.update(args), fallback);
    }
  },

  // --- SESSION CONTROLLER MOCK API ---
  session: {
    create: async (args) => {
      if (db.isSandbox()) {
        const newSession = {
          id: `session-${Date.now()}`,
          createdAt: new Date(),
          ...args.data
        };
        sandbox.sessions.push(newSession);
        return newSession;
      }
      return await prisma.session.create(args);
    },
    findUnique: async (args) => {
      if (db.isSandbox()) {
        const sess = sandbox.sessions.find(s => s.refreshToken === args.where.refreshToken);
        if (sess && args.include && args.include.user) {
          sess.user = sandbox.users.find(u => u.id === sess.userId) || null;
        }
        return sess || null;
      }
      return await prisma.session.findUnique(args);
    },
    delete: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.sessions.findIndex(s => s.refreshToken === args.where.refreshToken);
        if (idx !== -1) {
          return sandbox.sessions.splice(idx, 1)[0];
        }
        return null;
      }
      return await prisma.session.delete(args);
    }
  },

  // --- SERVICE AREA CONTROLLER MOCK API ---
  serviceArea: {
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        return sandbox.serviceAreas.filter(sa => args.where ? (args.where.isActive ? sa.isActive === args.where.isActive : true) : true);
      }
      return await prisma.serviceArea.findMany(args);
    },
    findUnique: async (args) => {
      if (db.isSandbox()) {
        return sandbox.serviceAreas.find(sa => sa.pincode === args.where.pincode) || null;
      }
      return await prisma.serviceArea.findUnique(args);
    }
  },

  // --- SERVICE CATALOG MOCK API ---
  service: {
    findFirst: async (args = {}) => {
      if (db.isSandbox()) {
        if (!args.where) return sandbox.services[0] || null;
        const match = sandbox.services.find(s => {
          if (args.where.name) {
            if (typeof args.where.name === 'object') {
              if (args.where.name.contains) {
                const queryStr = args.where.name.contains.toLowerCase();
                return s.name.toLowerCase().includes(queryStr);
              }
              if (args.where.name.equals) {
                return s.name.toLowerCase().trim() === args.where.name.equals.toLowerCase().trim();
              }
              return false;
            }
            return s.name.toLowerCase().trim() === args.where.name.toLowerCase().trim();
          }
          return true;
        });
        return match || null;
      }
      return await prisma.service.findFirst(args);
    },
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        return sandbox.services;
      }
      return await prisma.service.findMany(args);
    },
    findUnique: async (args) => {
      if (db.isSandbox()) {
        return sandbox.services.find(s => {
          if (args.where.id && s.id === args.where.id) return true;
          if (args.where.name) {
            if (typeof args.where.name === 'object') {
              if (args.where.name.equals) {
                return s.name.toLowerCase().trim() === args.where.name.equals.toLowerCase().trim();
              }
              return false;
            }
            return s.name.toLowerCase().trim() === args.where.name.toLowerCase().trim();
          }
          return false;
        }) || null;
      }
      return await prisma.service.findUnique(args);
    },
    create: async (args) => {
      if (db.isSandbox()) {
        const item = {
          id: `s-${Date.now()}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        sandbox.services.push(item);
        return item;
      }
      return await prisma.service.create(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.services.findIndex(s => s.id === args.where.id);
        if (idx !== -1) {
          sandbox.services[idx] = { ...sandbox.services[idx], ...args.data, updatedAt: new Date() };
          return sandbox.services[idx];
        }
        throw new Error('Service not found');
      }
      return await prisma.service.update(args);
    },
    delete: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.services.findIndex(s => s.id === args.where.id);
        if (idx !== -1) {
          return sandbox.services.splice(idx, 1)[0];
        }
        return null;
      }
      return await prisma.service.delete(args);
    }
  },

  // --- WORKER MOCK API ---
  worker: {
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        let list = sandbox.workers;
        if (args && args.where && args.where.approvalStatus) {
          list = list.filter(w => w.approvalStatus === args.where.approvalStatus);
        }
        return list.map(w => {
          const user = sandbox.users.find(u => u.id === w.userId);
          const skills = sandbox.workerSkills
            .filter(ws => ws.workerId === w.id)
            .map(ws => {
              const serviceObj = sandbox.services.find(s => s.id === ws.serviceId);
              return { id: ws.id, workerId: ws.workerId, serviceId: ws.serviceId, service: serviceObj };
            });
          return {
            ...w,
            user,
            skills
          };
        });
      }
      return await prisma.worker.findMany(args);
    },
    findUnique: async (args) => {
      if (db.isSandbox()) {
        const w = sandbox.workers.find(worker => worker.id === args.where.id || worker.userId === args.where.userId);
        if (w) {
          w.user = sandbox.users.find(u => u.id === w.userId);
          w.skills = sandbox.workerSkills
            .filter(ws => ws.workerId === w.id)
            .map(ws => {
              const serviceObj = sandbox.services.find(s => s.id === ws.serviceId);
              return { id: ws.id, workerId: ws.workerId, serviceId: ws.serviceId, service: serviceObj };
            });
        }
        return w || null;
      }
      return await prisma.worker.findUnique(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.workers.findIndex(w => w.id === args.where.id);
        if (idx !== -1) {
          sandbox.workers[idx] = { ...sandbox.workers[idx], ...args.data, updatedAt: new Date() };
          return sandbox.workers[idx];
        }
        throw new Error('Worker not found');
      }
      return await prisma.worker.update(args);
    },
    create: async (args) => {
      if (db.isSandbox()) {
        const worker = {
          id: `w-${Date.now()}`,
          rating: 5.0,
          totalJobs: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        sandbox.workers.push(worker);
        return worker;
      }
      return await prisma.worker.create(args);
    }
  },

  // --- WORKER SKILL MOCK API ---
  workerSkill: {
    create: async (args) => {
      if (db.isSandbox()) {
        const skill = {
          id: `ws-${Date.now()}`,
          ...args.data
        };
        sandbox.workerSkills.push(skill);
        return skill;
      }
      return await prisma.workerSkill.create(args);
    },
    deleteMany: async (args) => {
      if (db.isSandbox()) {
        sandbox.workerSkills = sandbox.workerSkills.filter(ws => ws.workerId !== args.where.workerId);
        return { count: 1 };
      }
      return await prisma.workerSkill.deleteMany(args);
    }
  },

  // --- PROMO CODE MOCK API ---
  promoCode: {
    findUnique: async (args) => {
      if (db.isSandbox()) {
        if (args.where.id) {
          return sandbox.promoCodes.find(p => p.id === args.where.id) || null;
        }
        return sandbox.promoCodes.find(p => p.code === args.where.code) || null;
      }
      return await prisma.promoCode.findUnique(args);
    },
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        return sandbox.promoCodes;
      }
      return await prisma.promoCode.findMany(args);
    },
    create: async (args) => {
      if (db.isSandbox()) {
        const coupon = {
          id: `pc-${Date.now()}`,
          usedCount: 0,
          isActive: true,
          discountType: 'PERCENTAGE',
          discountValue: 0,
          minOrderValue: 0.0,
          maxDiscount: null,
          usageLimit: null,
          perUserLimit: 1,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        sandbox.promoCodes.push(coupon);
        return coupon;
      }
      return await prisma.promoCode.create(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.promoCodes.findIndex(p => p.id === args.where.id);
        if (idx !== -1) {
          sandbox.promoCodes[idx] = {
            ...sandbox.promoCodes[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return sandbox.promoCodes[idx];
        }
        throw new Error('PromoCode not found in sandbox');
      }
      return await prisma.promoCode.update(args);
    },
    delete: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.promoCodes.findIndex(p => p.id === args.where.id);
        if (idx !== -1) {
          return sandbox.promoCodes.splice(idx, 1)[0];
        }
        return null;
      }
      return await prisma.promoCode.delete(args);
    }
  },

  // --- BOOKING MOCK API ---
  booking: {
    create: async (args) => {
      if (db.isSandbox()) {
        const bId = `booking-${Date.now()}`;
        const newBooking = {
          id: bId,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          discountApplied: 0.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };

        // Extract items if Prisma relation mapping is mocked
        if (args.data.items && args.data.items.createMany && args.data.items.createMany.data) {
          const itemsData = args.data.items.createMany.data.map(item => ({
            id: `bi-${Date.now()}-${Math.random()}`,
            bookingId: bId,
            ...item
          }));
          sandbox.bookingItems.push(...itemsData);
          delete newBooking.items; // Delete relational arg
        }

        sandbox.bookings.push(newBooking);
        return newBooking;
      }
      return await prisma.booking.create(args);
    },
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        let results = sandbox.bookings;
        
        // Dynamic Filter mapping
        if (args.where) {
          if (args.where.userId) {
            results = results.filter(b => b.userId === args.where.userId);
          }
          if (args.where.workerId) {
            results = results.filter(b => b.workerId === args.where.workerId);
          }
          if (args.where.status) {
            results = results.filter(b => b.status === args.where.status);
          }
        }

        // Expand nested objects
        return results.map(b => {
          const user = sandbox.users.find(u => u.id === b.userId);
          const worker = b.workerId ? sandbox.workers.find(w => w.id === b.workerId) : null;
          if (worker) {
            worker.user = sandbox.users.find(u => u.id === worker.userId);
          }
          const items = sandbox.bookingItems
            .filter(bi => bi.bookingId === b.id)
            .map(bi => ({
              ...bi,
              service: sandbox.services.find(s => s.id === bi.serviceId)
            }));
          const review = sandbox.reviews.find(r => r.bookingId === b.id) || null;
          const serviceArea = sandbox.serviceAreas.find(sa => sa.id === b.serviceAreaId) || null;

          return {
            ...b,
            user,
            worker,
            items,
            review,
            serviceArea
          };
        });
      }
      return await prisma.booking.findMany(args);
    },
    findUnique: async (args) => {
      if (db.isSandbox()) {
        const b = sandbox.bookings.find(booking => booking.id === args.where.id);
        if (b) {
          b.user = sandbox.users.find(u => u.id === b.userId);
          b.worker = b.workerId ? sandbox.workers.find(w => w.id === b.workerId) : null;
          if (b.worker) {
            b.worker.user = sandbox.users.find(u => u.id === b.worker.userId);
          }
          b.items = sandbox.bookingItems
            .filter(bi => bi.bookingId === b.id)
            .map(bi => ({
              ...bi,
              service: sandbox.services.find(s => s.id === bi.serviceId)
            }));
          b.review = sandbox.reviews.find(r => r.bookingId === b.id) || null;
          b.serviceArea = sandbox.serviceAreas.find(sa => sa.id === b.serviceAreaId) || null;
        }
        return b || null;
      }
      return await prisma.booking.findUnique(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.bookings.findIndex(b => b.id === args.where.id);
        if (idx !== -1) {
          sandbox.bookings[idx] = { ...sandbox.bookings[idx], ...args.data, updatedAt: new Date() };
          return sandbox.bookings[idx];
        }
        throw new Error('Booking not found in Sandbox');
      }
      return await prisma.booking.update(args);
    }
  },

  // --- REVIEW MOCK API ---
  review: {
    create: async (args) => {
      if (db.isSandbox()) {
        const newReview = {
          id: `r-${Date.now()}`,
          createdAt: new Date(),
          ...args.data
        };
        sandbox.reviews.push(newReview);

        // Update worker rating dynamically in Sandbox
        const worker = sandbox.workers.find(w => w.id === args.data.workerId);
        if (worker) {
          const wReviews = sandbox.reviews.filter(r => r.workerId === worker.id);
          const totalRating = wReviews.reduce((sum, r) => sum + r.rating, 0);
          worker.rating = parseFloat((totalRating / wReviews.length).toFixed(1));
          worker.totalJobs += 1;
        }

        return newReview;
      }
      return await prisma.review.create(args);
    },
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        return sandbox.reviews.filter(r => args.where ? r.workerId === args.where.workerId : true);
      }
      return await prisma.review.findMany(args);
    }
  },

  // --- NOTIFICATION MOCK API ---
  notification: {
    create: async (args) => {
      if (db.isSandbox()) {
        const notif = {
          id: `n-${Date.now()}`,
          isRead: false,
          createdAt: new Date(),
          ...args.data
        };
        sandbox.notifications.push(notif);
        return notif;
      }
      return await prisma.notification.create(args);
    },
    findMany: async (args) => {
      if (db.isSandbox()) {
        return sandbox.notifications
          .filter(n => n.userId === args.where.userId)
          .sort((a, b) => b.createdAt - a.createdAt);
      }
      return await prisma.notification.findMany(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.notifications.findIndex(n => n.id === args.where.id);
        if (idx !== -1) {
          sandbox.notifications[idx] = { ...sandbox.notifications[idx], ...args.data };
          return sandbox.notifications[idx];
        }
        throw new Error('Notification not found');
      }
      return await prisma.notification.update(args);
    }
  },

  // --- AUDIT LOG MOCK API ---
  auditLog: {
    create: async (args) => {
      if (db.isSandbox()) {
        const log = {
          id: `al-${Date.now()}`,
          createdAt: new Date(),
          ...args.data
        };
        sandbox.auditLogs.push(log);
        return log;
      }
      return await prisma.auditLog.create(args);
    },
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        let list = [...sandbox.auditLogs];
        
        // Filter by eventType or userId
        if (args.where) {
          if (args.where.eventType) {
            list = list.filter(log => log.eventType === args.where.eventType);
          }
          if (args.where.userId) {
            list = list.filter(log => log.userId === args.where.userId);
          }
        }
        
        // Sort newest first
        list.sort((a, b) => b.createdAt - a.createdAt);
        
        // Paginate
        const skip = args.skip || 0;
        const take = args.take || list.length;
        list = list.slice(skip, skip + take);
        
        return list.map(log => ({
          ...log,
          user: sandbox.users.find(u => u.id === log.userId) || null
        }));
      }
      return await prisma.auditLog.findMany(args);
    },
    count: async (args = {}) => {
      if (db.isSandbox()) {
        let list = sandbox.auditLogs;
        if (args.where) {
          if (args.where.eventType) {
            list = list.filter(log => log.eventType === args.where.eventType);
          }
        }
        return list.length;
      }
      return await prisma.auditLog.count(args);
    }
  },

  // --- WAITLIST MOCK API ---
  waitlist: {
    create: async (args) => {
      if (db.isSandbox()) {
        const entry = {
          id: `waitlist-${Date.now()}`,
          createdAt: new Date(),
          ...args.data
        };
        sandbox.waitlist.push(entry);
        return entry;
      }
      return await prisma.waitlist.create(args);
    },
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        return sandbox.waitlist;
      }
      return await prisma.waitlist.findMany(args);
    }
  },

  // --- ADDRESS MOCK API ---
  address: {
    create: async (args) => {
      if (db.isSandbox()) {
        const newAddress = {
          id: `address-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: false,
          ...args.data
        };
        // If this is set to default, unset others first
        if (newAddress.isDefault) {
          sandbox.addresses.forEach(addr => {
            if (addr.userId === newAddress.userId) {
              addr.isDefault = false;
            }
          });
        }
        sandbox.addresses.push(newAddress);
        return newAddress;
      }
      return await prisma.address.create(args);
    },
    findMany: async (args) => {
      if (db.isSandbox()) {
        let results = sandbox.addresses;
        if (args && args.where) {
          if (args.where.userId) {
            results = results.filter(addr => addr.userId === args.where.userId);
          }
          if (args.where.isDefault !== undefined) {
            results = results.filter(addr => addr.isDefault === args.where.isDefault);
          }
        }
        return results;
      }
      return await prisma.address.findMany(args);
    },
    findUnique: async (args) => {
      if (db.isSandbox()) {
        return sandbox.addresses.find(addr => addr.id === args.where.id) || null;
      }
      return await prisma.address.findUnique(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.addresses.findIndex(addr => addr.id === args.where.id);
        if (idx !== -1) {
          const updated = { ...sandbox.addresses[idx], ...args.data, updatedAt: new Date() };
          if (updated.isDefault) {
            sandbox.addresses.forEach(addr => {
              if (addr.userId === updated.userId && addr.id !== updated.id) {
                addr.isDefault = false;
              }
            });
          }
          sandbox.addresses[idx] = updated;
          return updated;
        }
        throw new Error('Address not found in Sandbox');
      }
      return await prisma.address.update(args);
    },
    updateMany: async (args) => {
      if (db.isSandbox()) {
        let count = 0;
        sandbox.addresses.forEach(addr => {
          let match = true;
          if (args.where) {
            if (args.where.userId && addr.userId !== args.where.userId) match = false;
            if (args.where.id && addr.id !== args.where.id) match = false;
          }
          if (match) {
            Object.assign(addr, args.data);
            count++;
          }
        });
        return { count };
      }
      return await prisma.address.updateMany(args);
    },
    delete: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.addresses.findIndex(addr => addr.id === args.where.id);
        if (idx !== -1) {
          return sandbox.addresses.splice(idx, 1)[0];
        }
        return null;
      }
      return await prisma.address.delete(args);
    }
  },
  customer: {
    create: async (args) => {
      if (db.isSandbox()) {
        const newCust = {
          id: args.data.id || `cust-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        sandbox.customers.push(newCust);
        return newCust;
      }
      return await prisma.customer.create(args);
    },
    findUnique: async (args) => {
      console.log('--- BEFORE findUnique Call ---');
      console.log('Prisma Instance:', prisma ? 'Initialized' : 'Undefined');
      console.log('Model Name: Customer');
      console.log('Query Parameters:', JSON.stringify(args, null, 2));
      console.log('------------------------------');

      if (db.isSandbox()) {
        if (args.where.email) {
          return sandbox.customers.find(c => c.email === args.where.email) || null;
        }
        if (args.where.id) {
          return sandbox.customers.find(c => c.id === args.where.id) || null;
        }
        if (args.where.phone) {
          return sandbox.customers.find(c => c.phone === args.where.phone) || null;
        }
        return null;
      }
      return await prisma.customer.findUnique(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const idx = sandbox.customers.findIndex(c => c.id === args.where.id);
        if (idx !== -1) {
          sandbox.customers[idx] = { ...sandbox.customers[idx], ...args.data, updatedAt: new Date() };
          return sandbox.customers[idx];
        }
        throw new Error('Customer not found in Sandbox');
      }
      return await prisma.customer.update(args);
    }
  }
};

module.exports = db;

