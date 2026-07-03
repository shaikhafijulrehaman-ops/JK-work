const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot run seed in production!');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data in reverse order of relations
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.bookingItem.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.emailLog.deleteMany({}).catch(() => {});
  await prisma.bookingStatusHistory.deleteMany({}).catch(() => {});
  await prisma.partnerPerformance.deleteMany({}).catch(() => {});
  await prisma.revenueData.deleteMany({}).catch(() => {});
  await prisma.servicePartner.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.serviceArea.deleteMany({});
  await prisma.promoCode.deleteMany({});

  console.log('Database cleared.');

  // 2. Hash Passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  // 3. Create Service Areas
  const area1 = await prisma.serviceArea.create({
    data: { city: 'Bengaluru', pincode: '560073', isActive: true }, // Anchepalya
  });
  const area2 = await prisma.serviceArea.create({
    data: { city: 'Bengaluru', pincode: '560074', isActive: true },
  });

  console.log('Service areas seeded.');

  // 4. Create Promo Codes
  const promo1 = await prisma.promoCode.create({
    data: { code: '9MINUTES', discountType: 'PERCENTAGE', discountValue: 15.0, isActive: true },
  });
  const promo2 = await prisma.promoCode.create({
    data: { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10.0, isActive: true },
  });

  console.log('Promo codes seeded.');

  // 5. Create Brochure Services
  const servicesData = [
    {
      name: 'Baby Care',
      category: 'Care',
      description: 'Professional baby care support at home by trained and verified caregivers. Safe, responsible, and caring service for infants and children with trusted assistance for daily needs.',
      price: 799.0,
      durationText: '6 Hours',
      packageText: 'Daily Needs',
      imageUrl: '/services/babycare.webp',
    },
    {
      name: 'Full House Deep Cleaning',
      category: 'Cleaning',
      description: 'Complete deep cleaning service for the entire home including living room, bedrooms, kitchen, and bathroom. Professional equipment used for premium hygiene and spotless results.',
      price: 3499.0,
      durationText: '',
      packageText: 'Deep Hygiene',
      imageUrl: '/services/housecleaning.webp',
    },
    {
      name: 'Bathroom Deep Cleaning',
      category: 'Cleaning',
      description: 'Deep sanitation and premium cleaning including tiles, fittings, mirrors, sinks, and floor cleaning with hygienic professional solutions for complete bathroom hygiene.',
      price: 749.0,
      durationText: '',
      packageText: 'Premium Sanitation',
      imageUrl: '/services/bathroom-cleaning.webp',
    },
    {
      name: 'Full Kitchen Cleaning',
      category: 'Cleaning',
      description: 'Complete kitchen cleaning including slabs, shelves, sink area, stove cleaning, and hygienic surface treatment for a fresh and organized cooking space.',
      price: 499.0,
      durationText: '',
      packageText: 'Fresh Kitchen',
      imageUrl: '/services/kitchen-cleaning.webp',
    },
    {
      name: 'Dust Cleaning',
      category: 'Cleaning',
      description: 'Quick and effective dust removal for furniture, electronics, shelves, windows, and home interiors to maintain a consistently fresh and clean environment.',
      price: 149.0,
      durationText: '1 Hour',
      packageText: 'Quick Dusting',
      imageUrl: '/services/dust-cleaning.webp',
    },
    {
      name: 'House Shifting',
      category: 'Shifting',
      description: 'Professional packing and shifting service for safe home relocation with trained staff, careful handling of furniture, appliances, and all household items.',
      price: 3499.0,
      durationText: '',
      packageText: '2BHK Package',
      imageUrl: '/services/house-shifting.webp',
    },
    {
      name: 'Cooking Service',
      category: 'Cooking',
      description: 'Professional home cooking support with hygienic preparation, kitchen assistance, and fresh meal service by trained and experienced home service professionals.',
      price: 149.0,
      durationText: '1 Hour',
      packageText: 'Meal Prep',
      imageUrl: '/services/cooking-service.webp',
    },
    {
      name: 'House Painting',
      category: 'Painting',
      description: 'Premium house painting service for interiors and exteriors with all materials included. Smooth finish, quality workmanship, and professional painters for beautiful lasting results.',
      price: 20099.0,
      durationText: '',
      packageText: 'All Materials Included',
      imageUrl: '/services/house-painting.webp',
    },
    {
      name: 'Electrician Service',
      category: 'Technical',
      description: 'Professional electrician support for repairs, installations, switchboards, wiring, fan fitting, lighting solutions, and all essential home electrical services.',
      price: 499.0,
      durationText: '1 Hour',
      packageText: 'Essential Repairs',
      imageUrl: '/services/electrician.webp',
    },
    {
      name: 'Security Provider',
      category: 'Care',
      description: 'Trained and verified security personnel for homes, apartments, offices, and events. Reliable protection with professional discipline and complete safety assurance.',
      price: 899.0,
      durationText: '8 Hours',
      packageText: 'Safe Protection',
      imageUrl: '/services/security-provider-v2.webp',
    },
    {
      name: 'Pest Control',
      category: 'Cleaning',
      description: 'Professional pest control treatment for cockroaches, insects, termites, and unwanted pests using safe and effective solutions for a clean and hygienic home.',
      price: 2599.0,
      durationText: '',
      packageText: '2BHK Package',
      imageUrl: '/services/pest-control-v2.webp',
    },
  ];

  const dbServices = {};
  for (const s of servicesData) {
    const service = await prisma.service.create({ data: s });
    dbServices[service.name] = service;
  }

  console.log('Brochure services seeded.');

  // 6. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@jkenterprises.com',
      password: adminPassword,
      name: 'JK Admin',
      phone: '8431588235',
      role: 'ADMIN',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@jkenterprises.com',
      password: customerPassword,
      name: 'Test Customer',
      phone: '9988776655',
      role: 'USER',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  console.log('Base accounts seeded.');

  // 7. Create Service Partners
  const partnersData = [
    {
      name: 'Ramesh Kumar',
      phone: '7766554433',
      email: 'ramesh@jkenterprises.com',
      serviceType: 'Cleaning'
    },
    {
      name: 'Vijay Kumar',
      phone: '8877665544',
      email: 'vijay@jkenterprises.com',
      serviceType: 'Technical'
    },
    {
      name: 'Anitha Reddy',
      phone: '9988776655',
      email: 'anitha@jkenterprises.com',
      serviceType: 'Care'
    },
    {
      name: 'Suresh Prasad',
      phone: '6655443322',
      email: 'suresh@jkenterprises.com',
      serviceType: 'Shifting'
    },
    {
      name: 'Rakesh Sharma',
      phone: '5544332211',
      email: 'sharma@jkenterprises.com',
      serviceType: 'Painting'
    }
  ];

  for (const p of partnersData) {
    await prisma.servicePartner.create({
      data: {
        name: p.name,
        phone: p.phone,
        email: p.email,
        serviceType: p.serviceType,
        status: 'AVAILABLE'
      }
    });
  }

  console.log('Service partners seeded.');

  // 8. Seed Audit Logs for logins
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        userName: admin.name,
        userEmail: admin.email,
        userRole: admin.role,
        eventType: 'LOGIN',
        action: 'ACCOUNT_LOGIN',
        details: JSON.stringify({ email: admin.email, role: admin.role }),
        ipAddress: '127.0.0.1',
        createdAt: new Date(Date.now() - 3600000 * 12)
      }
    ]
  });
  console.log('Audit logs seeded.');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
