const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

let prisma;
let isPrismaConnected = false;
let useSandbox = false;

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
  auditLogs: []
};

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
    { id: 'pc-1', code: '9MINUTES', discountPct: 15.0, isActive: true },
    { id: 'pc-2', code: 'WELCOME10', discountPct: 10.0, isActive: true }
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

  // User: Customer
  sandbox.users.push({
    id: 'user-cust',
    email: 'customer@gmail.com',
    password: hashPassword('customer123'),
    name: 'Aravind Swamy',
    phone: '9876543210',
    role: 'USER',
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: new Date()
  });

  // Services (11 Brochure items)
  const servicesList = [
    { id: 's-1', name: 'Baby Care', category: 'Care', price: 799, durationText: '6 Hours', packageText: 'Daily Needs', imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=600&auto=format&fit=crop', description: 'Professional baby care support at home by trained and verified caregivers. Safe, responsible, and caring service for infants and children with trusted assistance.' },
    { id: 's-2', name: 'Full House Deep Cleaning', category: 'Cleaning', price: 3499, durationText: '', packageText: 'Deep Hygiene', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop', description: 'Complete deep cleaning service for the entire home including living room, bedrooms, kitchen, and bathroom. Professional equipment used for premium hygiene.' },
    { id: 's-3', name: 'Bathroom Deep Cleaning', category: 'Cleaning', price: 749, durationText: '', packageText: 'Premium Sanitation', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop', description: 'Deep sanitation and premium cleaning including tiles, fittings, mirrors, sinks, and floor cleaning with hygienic professional solutions.' },
    { id: 's-4', name: 'Full Kitchen Cleaning', category: 'Cleaning', price: 499, durationText: '', packageText: 'Fresh Kitchen', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop', description: 'Complete kitchen cleaning including slabs, shelves, sink area, stove cleaning, and hygienic surface treatment.' },
    { id: 's-5', name: 'Dust Cleaning', category: 'Cleaning', price: 149, durationText: '1 Hour', packageText: 'Quick Dusting', imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600&auto=format&fit=crop', description: 'Quick and effective dust removal for furniture, electronics, shelves, windows, and home interiors.' },
    { id: 's-6', name: 'House Shifting', category: 'Shifting', price: 3499, durationText: '', packageText: '2BHK Package', imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=600&auto=format&fit=crop', description: 'Professional packing and shifting service for safe home relocation with trained staff.' },
    { id: 's-7', name: 'Cooking Service', category: 'Cooking', price: 149, durationText: '1 Hour', packageText: 'Meal Prep', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop', description: 'Professional home cooking support with hygienic preparation, kitchen assistance, and fresh meal service.' },
    { id: 's-8', name: 'House Painting', category: 'Painting', price: 20099, durationText: '', packageText: 'All Materials Included', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=600&auto=format&fit=crop', description: 'Premium house painting service for interiors and exteriors with all materials included. 2BHK: Rs. 20,099 | 3BHK: Rs. 23,499.' },
    { id: 's-9', name: 'Electrician Service', category: 'Technical', price: 499, durationText: '1 Hour', packageText: 'Essential Repairs', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop', description: 'Professional electrician support for repairs, installations, switchboards, wiring, fan fitting, and lighting.' },
    { id: 's-10', name: 'Security Provider', category: 'Care', price: 899, durationText: '8 Hours', packageText: 'Safe Protection', imageUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=600&auto=format&fit=crop', description: 'Trained and verified security personnel for homes, apartments, offices, and events.' },
    { id: 's-11', name: 'Pest Control', category: 'Cleaning', price: 2599, durationText: '', packageText: '2BHK Package', imageUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?q=80&w=600&auto=format&fit=crop', description: 'Professional pest control treatment for cockroaches, insects, termites, and unwanted pests.' }
  ];
  sandbox.services.push(...servicesList);

  // Workers
  const workersSeed = [
    { id: 'w-1', email: 'ramesh@jkenterprises.com', name: 'Ramesh Kumar', phone: '7766554433', rating: 4.8, commissionRate: 0.75, skills: ['Full House Deep Cleaning', 'Bathroom Deep Cleaning', 'Full Kitchen Cleaning', 'Dust Cleaning', 'Pest Control'] },
    { id: 'w-2', email: 'vijay@jkenterprises.com', name: 'Vijay Kumar', phone: '8877665544', rating: 4.9, commissionRate: 0.70, skills: ['Electrician Service'] },
    { id: 'w-3', email: 'anitha@jkenterprises.com', name: 'Anitha Reddy', phone: '9988776655', rating: 4.7, commissionRate: 0.80, skills: ['Baby Care', 'Cooking Service'] },
    { id: 'w-4', email: 'suresh@jkenterprises.com', name: 'Suresh Prasad', phone: '6655443322', rating: 4.6, commissionRate: 0.70, skills: ['House Shifting'] },
    { id: 'w-5', email: 'sharma@jkenterprises.com', name: 'Rakesh Sharma', phone: '5544332211', rating: 4.8, commissionRate: 0.75, skills: ['House Painting', 'Security Provider'] }
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
      rating: w.rating,
      totalJobs: 0,
      commissionRate: w.commissionRate,
      createdAt: new Date()
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

  // Pre-seed a sample active booking in Sandbox for tracking visibility
  sandbox.bookings.push({
    id: 'booking-sample',
    userId: 'user-cust',
    workerId: 'w-2',
    serviceAreaId: 'sa-1',
    status: 'ASSIGNED',
    scheduledAt: new Date(Date.now() + 86400000), // tomorrow
    timeSlot: '10:00 AM - 11:00 AM',
    address: 'Flat 402, Block A, Prestige Jindal City, Anchepalya, Bengaluru',
    phone: '9876543210',
    totalPrice: 499.0,
    discountApplied: 0.0,
    finalPrice: 499.0,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    paymentId: 'pay_sim_98761234',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  sandbox.bookingItems.push({
    id: 'bi-sample',
    bookingId: 'booking-sample',
    serviceId: 's-9', // Electrician
    quantity: 1,
    price: 499.0
  });

  console.log('[JK Enterprises DB] In-memory Sandbox Seeding completed.');
}

// Immediately Seed Sandbox so it is ready if Postgres is not connected
seedSandbox();

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

// 3. Relational API Query Interface that acts exactly like Prisma
const db = {
  // Check active mode
  isSandbox: () => useSandbox || !isPrismaConnected,
  getPrisma: () => prisma,

  // --- USER CONTROLLER MOCK API ---
  user: {
    findUnique: async (args) => {
      if (db.isSandbox()) {
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
      }
      return await prisma.user.findUnique(args);
    },
    create: async (args) => {
      if (db.isSandbox()) {
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
      }
      return await prisma.user.create(args);
    },
    update: async (args) => {
      if (db.isSandbox()) {
        const index = sandbox.users.findIndex(u => u.id === args.where.id);
        if (index !== -1) {
          sandbox.users[index] = { ...sandbox.users[index], ...args.data, updatedAt: new Date() };
          return sandbox.users[index];
        }
        throw new Error('User not found in Sandbox');
      }
      return await prisma.user.update(args);
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
    findMany: async (args = {}) => {
      if (db.isSandbox()) {
        return sandbox.services;
      }
      return await prisma.service.findMany(args);
    },
    findUnique: async (args) => {
      if (db.isSandbox()) {
        return sandbox.services.find(s => s.id === args.where.id || s.name === args.where.name) || null;
      }
      return await prisma.service.findUnique(args);
    },
    create: async (args) => {
      if (db.isSandbox()) {
        const item = {
          id: `s-${Date.now()}`,
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
        return sandbox.workers.map(w => {
          const user = sandbox.users.find(u => u.id === w.userId);
          const skills = sandbox.workerSkills
            .filter(ws => ws.workerId === w.id)
            .map(ws => sandbox.services.find(s => s.id === ws.serviceId));
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
            .map(ws => sandbox.services.find(s => s.id === ws.serviceId));
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
        return sandbox.promoCodes.find(p => p.code === args.where.code) || null;
      }
      return await prisma.promoCode.findUnique(args);
    },
    create: async (args) => {
      if (db.isSandbox()) {
        const coupon = {
          id: `pc-${Date.now()}`,
          usedCount: 0,
          isActive: true,
          ...args.data
        };
        sandbox.promoCodes.push(coupon);
        return coupon;
      }
      return await prisma.promoCode.create(args);
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
        return sandbox.auditLogs
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(log => ({
            ...log,
            user: sandbox.users.find(u => u.id === log.userId) || null
          }));
      }
      return await prisma.auditLog.findMany(args);
    }
  }
};

module.exports = db;
