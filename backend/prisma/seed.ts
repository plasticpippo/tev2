import { PrismaClient } from '@prisma/client';
import { User } from '../src/types';

const prisma = new PrismaClient();

const INITIAL_USERS: User[] = [
  { id: 1, name: 'Admin User', username: 'admin', password_HACK: 'admin123', role: 'Admin' },
  { id: 2, name: 'Cashier User', username: 'cashier', password_HACK: 'cashier123', role: 'Cashier' },
];

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Clear existing data (optional, for development)
    await prisma.settings.deleteMany({});
    await prisma.orderActivityLog.deleteMany({});
    await prisma.stockConsumption.deleteMany({}); // Clear stock consumptions first
    await prisma.stockAdjustment.deleteMany({});
    await prisma.tab.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.stockItem.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.till.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users
    const users = await Promise.all(
      INITIAL_USERS.map((user) => 
        prisma.user.create({
          data: {
            name: user.name,
            username: user.username,
            password_HACK: user.password_HACK,
            role: user.role,
          },
        })
      )
    );
    console.log('Created users:', users.length);

    // Create tills
    const tills = await Promise.all([
      prisma.till.create({
        data: { name: 'Main Bar' },
      }),
      prisma.till.create({
        data: { name: 'Patio' },
      }),
    ]);
    console.log('Created tills:', tills.length);

    // Create categories
    const categories = await Promise.all([
      prisma.category.create({
        data: { 
          name: 'Red Wine', 
          visibleTillIds: [] // JSON field with empty array
        },
      }),
      prisma.category.create({
        data: { 
          name: 'Beer', 
          visibleTillIds: [1] // Visible only on Main Bar
        },
      }),
      prisma.category.create({
        data: { 
          name: 'Cocktails', 
          visibleTillIds: [] // Visible on all
        },
      }),
    ]);
    console.log('Created categories:', categories.length);

    // Create stock items
    const stockItems = await Promise.all([
      prisma.stockItem.create({
        data: {
          name: 'Merlot Bulk',
          quantity: 9000,
          type: 'Ingredient',
          baseUnit: 'ml',
          purchasingUnits: JSON.stringify([
            { id: 'pu1', name: 'Bottle', multiplier: 750 },
            { id: 'pu2', name: 'Case (12 Bottles)', multiplier: 9000 },
          ]),
        },
      }),
      prisma.stockItem.create({
        data: {
          name: 'Lager Bottle',
          quantity: 100,
          type: 'Sellable Good',
          baseUnit: 'pcs',
          purchasingUnits: JSON.stringify([
            { id: 'pu3', name: 'Single', multiplier: 1 },
            { id: 'pu4', name: '6-Pack', multiplier: 6 },
            { id: 'pu5', name: 'Case (24)', multiplier: 24 },
          ]),
        },
      }),
      prisma.stockItem.create({
        data: {
          name: 'Vodka',
          quantity: 3000,
          type: 'Ingredient',
          baseUnit: 'ml',
          purchasingUnits: JSON.stringify([
            { id: 'pu6', name: 'Bottle (750ml)', multiplier: 750 },
          ]),
        },
      }),
      prisma.stockItem.create({
        data: {
          name: 'Tonic Water',
          quantity: 5000,
          type: 'Ingredient',
          baseUnit: 'ml',
          purchasingUnits: JSON.stringify([
            { id: 'pu7', name: 'Can (200ml)', multiplier: 200 },
            { id: 'pu8', name: 'Bottle (1L)', multiplier: 100 },
          ]),
        },
      }),
    ]);
    console.log('Created stock items:', stockItems.length);

    // Create products and variants
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Merlot',
          categoryId: categories[0].id, // Red Wine
          variants: {
            create: [
              {
                name: 'Glass (150ml)',
                price: 8.5,
                isFavourite: true,
                backgroundColor: 'bg-red-800',
                textColor: 'text-white',
                stockConsumption: {
                  create: {
                    stockItemId: stockItems[0].id, // Merlot Bulk
                    quantity: 150,
                  },
                },
              },
              {
                name: 'Bottle',
                price: 32.0,
                isFavourite: false,
                backgroundColor: 'bg-red-800',
                textColor: 'text-white',
                stockConsumption: {
                  create: {
                    stockItemId: stockItems[0].id, // Merlot Bulk
                    quantity: 750,
                  },
                },
              },
            ],
          },
        },
        include: {
          variants: {
            include: {
              stockConsumption: true,
            },
          },
        },
      }),
      prisma.product.create({
        data: {
          name: 'Local Lager',
          categoryId: categories[1].id, // Beer
          variants: {
            create: [
              {
                name: 'Bottle',
                price: 6.0,
                isFavourite: true,
                backgroundColor: 'bg-amber-500',
                textColor: 'text-white',
                stockConsumption: {
                  create: {
                    stockItemId: stockItems[1].id, // Lager Bottle
                    quantity: 1,
                  },
                },
              },
            ],
          },
        },
        include: {
          variants: {
            include: {
              stockConsumption: true,
            },
          },
        },
      }),
      prisma.product.create({
        data: {
          name: 'Vodka & Tonic',
          categoryId: categories[2].id, // Cocktails
          variants: {
            create: [
              {
                name: 'Single',
                price: 9.0,
                isFavourite: false,
                backgroundColor: 'bg-sky-700',
                textColor: 'text-white',
                stockConsumption: {
                  create: [
                    {
                      stockItemId: stockItems[2].id, // Vodka
                      quantity: 40,
                    },
                    {
                      stockItemId: stockItems[3].id, // Tonic Water
                      quantity: 150,
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          variants: {
            include: {
              stockConsumption: true,
            },
          },
        },
      }),
    ]);
    console.log('Created products:', products.length);

    // Create settings
    await prisma.settings.create({
      data: {
        taxMode: 'exclusive',
        autoStartTime: '06:00',
        lastManualClose: null,
      },
    });
    console.log('Created settings');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };