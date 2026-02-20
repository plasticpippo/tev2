import { PrismaClient, Decimal } from '@prisma/client';
import { User } from '../src/types';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const INITIAL_USERS: Array<Omit<User, 'id'> & { password: string }> = [
  { name: 'Admin User', username: 'admin', password: 'admin123', role: 'Admin' },
  { name: 'Cashier User', username: 'cashier', password: 'cashier123', role: 'Cashier' },
];

async function seedTaxRates() {
  console.log('Seeding tax rates...');
  
  const taxRates = [
    { name: 'Zero Rate', rate: new Decimal(0.0000), description: '0% tax rate', isDefault: false, isActive: true },
    { name: 'Reduced Rate', rate: new Decimal(0.1000), description: '10% tax rate', isDefault: false, isActive: true },
    { name: 'Standard Rate', rate: new Decimal(0.1900), description: '19% tax rate', isDefault: true, isActive: true },
    { name: 'Luxury Rate', rate: new Decimal(0.2200), description: '22% tax rate', isDefault: false, isActive: true },
  ];

  for (const taxRate of taxRates) {
    await prisma.taxRate.upsert({
      where: { name: taxRate.name },
      update: taxRate,
      create: taxRate,
    });
  }
  
  console.log('Created/updated tax rates:', taxRates.length);
  
  // Return the default tax rate for use in settings
  return prisma.taxRate.findFirst({ where: { isDefault: true } });
}

async function seedDatabase() {
  try {
    console.log('Checking for essential data in database...');

    // Check if essential data already exists
    const userCount = await prisma.user.count();
    const tillCount = await prisma.till.count();
    const categoryCount = await prisma.category.count();
    const settingsCount = await prisma.settings.count();
    const productCount = await prisma.product.count();
    const taxRateCount = await prisma.taxRate.count();

    // Only seed essential data if none exists
    if (userCount === 0) {
      console.log('Seeding users...');
      
      // Create users with hashed passwords
      const users = await Promise.all(
        INITIAL_USERS.map(async (user) => {
          const hashedPassword = await hashPassword(user.password);
          return prisma.user.create({
            data: {
              name: user.name,
              username: user.username,
              password: hashedPassword,
              role: user.role,
            },
          });
        })
      );
      console.log('Created users:', users.length);
    } else {
      console.log(`Users already exist (${userCount}), skipping user seeding`);
    }

    if (tillCount === 0) {
      console.log('Seeding tills...');
      
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
    } else {
      console.log(`Tills already exist (${tillCount}), skipping till seeding`);
    }

    if (categoryCount <= 2) { // Allow for special categories (-1, 0) but seed if no regular categories exist
      console.log('Seeding categories...');
      
      // Check if regular categories (id > 0) exist
      const regularCategoryCount = await prisma.category.count({
        where: {
          id: { gt: 0 } // greater than 0
        }
      });

      if (regularCategoryCount === 0) {
        // Create regular categories
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
          prisma.category.create({
            data: {
              name: 'Whiskey',
              visibleTillIds: [] // Visible on all
            },
          }),
          prisma.category.create({
            data: {
              name: 'Soft Drinks',
              visibleTillIds: [] // Visible on all
            },
          }),
        ]);
        console.log('Created regular categories:', categories.length);
      } else {
        console.log(`Regular categories already exist (${regularCategoryCount}), skipping category seeding`);
      }
    } else {
      console.log(`Categories already exist (${categoryCount}), skipping category seeding`);
    }

    // Seed tax rates
    let defaultTaxRate = await prisma.taxRate.findFirst({ where: { isDefault: true } });
    if (taxRateCount === 0) {
      defaultTaxRate = await seedTaxRates();
    } else {
      console.log(`Tax rates already exist (${taxRateCount}), skipping tax rate seeding`);
    }

    if (settingsCount === 0) {
      console.log('Seeding settings...');
      
      // Create settings with reference to default tax rate
      await prisma.settings.create({
        data: {
          taxMode: 'exclusive',
          autoStartTime: '06:00',
          lastManualClose: null,
          defaultTaxRateId: defaultTaxRate?.id ?? null,
        },
      });
      console.log('Created settings');
    } else {
      console.log(`Settings already exist (${settingsCount}), skipping settings seeding`);
    }

    // Seed products and variants if none exist
    if (productCount === 0) {
      console.log('Seeding products and variants...');
      
      // Find categories to link products to
      const redWineCategory = await prisma.category.findFirst({ where: { name: 'Red Wine' } });
      const beerCategory = await prisma.category.findFirst({ where: { name: 'Beer' } });
      const cocktailCategory = await prisma.category.findFirst({ where: { name: 'Cocktails' } });
      const whiskeyCategory = await prisma.category.findFirst({ where: { name: 'Whiskey' } });
      const softDrinksCategory = await prisma.category.findFirst({ where: { name: 'Soft Drinks' } });

      if (redWineCategory && beerCategory && cocktailCategory && whiskeyCategory && softDrinksCategory) {
        // Create products and their variants
        const wineProduct = await prisma.product.create({
          data: {
            name: 'Cabernet Sauvignon',
            categoryId: redWineCategory.id,
            variants: {
              create: [
                {
                  name: 'Glass',
                  price: 8.50,
                  isFavourite: true,
                  backgroundColor: '#8B0000',
                  textColor: '#FFFFFF'
                },
                {
                  name: 'Bottle',
                  price: 32.00,
                  backgroundColor: '#A52A2A',
                  textColor: '#FFFFFF'
                }
              ]
            }
          }
        });

        const beerProduct = await prisma.product.create({
          data: {
            name: 'IPA',
            categoryId: beerCategory.id,
            variants: {
              create: [
                {
                  name: 'Draft',
                  price: 6.00,
                  isFavourite: true,
                  backgroundColor: '#DAA520',
                  textColor: '#000000'
                },
                {
                  name: 'Bottle',
                  price: 7.00,
                  backgroundColor: '#DEB887',
                  textColor: '#000000'
                }
              ]
            }
          }
        });

        const cocktailProduct = await prisma.product.create({
          data: {
            name: 'Mojito',
            categoryId: cocktailCategory.id,
            variants: {
              create: [
                {
                  name: 'Regular',
                  price: 12.00,
                  isFavourite: true,
                  backgroundColor: '#32CD32',
                  textColor: '#FFFFFF'
                }
              ]
            }
          }
        });

        const whiskeyProduct = await prisma.product.create({
          data: {
            name: 'Scotch Whiskey',
            categoryId: whiskeyCategory.id,
            variants: {
              create: [
                {
                  name: 'Neat',
                  price: 10.00,
                  isFavourite: false,
                  backgroundColor: '#CD853F',
                  textColor: '#FFFFFF'
                },
                {
                  name: 'On the Rocks',
                  price: 10.00,
                  isFavourite: true,
                  backgroundColor: '#D2691E',
                  textColor: '#FFFFFF'
                }
              ]
            }
          }
        });

        const sodaProduct = await prisma.product.create({
          data: {
            name: 'Coca Cola',
            categoryId: softDrinksCategory.id,
            variants: {
              create: [
                {
                  name: 'Can',
                  price: 3.50,
                  isFavourite: false,
                  backgroundColor: '#FF0000',
                  textColor: '#FFFFFF'
                },
                {
                  name: 'Bottle',
                  price: 4.00,
                  isFavourite: false,
                  backgroundColor: '#8B0000',
                  textColor: '#FFFFFF'
                }
              ]
            }
          }
        });

        console.log('Created products and variants:', [wineProduct, beerProduct, cocktailProduct, whiskeyProduct, sodaProduct].length);
      } else {
        console.log('Some categories not found, skipping product seeding');
      }
    } else {
      console.log(`Products already exist (${productCount}), skipping product seeding`);
    }

    console.log('Database seeding check completed successfully!');
  } catch (error) {
    console.error('Error checking/seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };