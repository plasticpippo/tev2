import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();
const D = (v: string | number) => new Prisma.Decimal(v);

// Predefined UUIDs for stock items so we can reference them in consumption links
const STOCK_IDS = {
  vodka: 'a0000000-0000-0000-0000-000000000001',
  gin: 'a0000000-0000-0000-0000-000000000002',
  rum: 'a0000000-0000-0000-0000-000000000003',
  campari: 'a0000000-0000-0000-0000-000000000004',
  sweetVermouth: 'a0000000-0000-0000-0000-000000000005',
  limeJuice: 'a0000000-0000-0000-0000-000000000006',
  mintLeaves: 'a0000000-0000-0000-0000-000000000007',
  coffeeBeans: 'a0000000-0000-0000-0000-000000000008',
  sugarSyrup: 'a0000000-0000-0000-0000-000000000009',
  beerKegLager: 'a0000000-0000-0000-0000-000000000010',
  beerKegIpa: 'a0000000-0000-0000-0000-000000000011',
  cocaColaCan: 'a0000000-0000-0000-0000-000000000012',
  sparklingWaterBottle: 'a0000000-0000-0000-0000-000000000013',
  wineBottleChianti: 'a0000000-0000-0000-0000-000000000014',
  wineBottleProsecco: 'a0000000-0000-0000-0000-000000000015',
};

// ─── Users ───────────────────────────────────────────────────────────

async function seedUsers() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`Users already exist (${count}), skipping`);
    return prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  const specs = [
    { name: 'Admin User', username: 'admin', password: 'admin123', role: 'Admin' },
    { name: 'Cashier User', username: 'cashier', password: 'cashier123', role: 'Cashier' },
    { name: 'Manager User', username: 'manager', password: 'manager123', role: 'Admin' },
  ];

  const users = [];
  for (const s of specs) {
    const hashed = await hashPassword(s.password);
    users.push(
      await prisma.user.create({
        data: { name: s.name, username: s.username, password: hashed, role: s.role },
      })
    );
  }
  console.log(`Created ${users.length} users`);
  return users;
}

// ─── Tax Rates ───────────────────────────────────────────────────────

async function seedTaxRates() {
  const count = await prisma.taxRate.count();
  if (count > 0) {
    console.log(`TaxRates already exist (${count}), skipping`);
    return prisma.taxRate.findMany({ orderBy: { id: 'asc' } });
  }

  const rates = [
    { name: 'Zero Rate', rate: D('0.0000'), description: '0% tax rate', isDefault: false, isActive: true },
    { name: 'Reduced Rate', rate: D('0.1000'), description: '10% tax rate', isDefault: false, isActive: true },
    { name: 'Standard Rate', rate: D('0.1900'), description: '19% tax rate', isDefault: true, isActive: true },
    { name: 'Luxury Rate', rate: D('0.2200'), description: '22% tax rate', isDefault: false, isActive: true },
  ];

  const result = [];
  for (const r of rates) {
    result.push(await prisma.taxRate.create({ data: r }));
  }
  console.log(`Created ${result.length} tax rates`);
  return result;
}

// ─── Settings ────────────────────────────────────────────────────────

async function seedSettings(defaultTaxRateId: number) {
  const count = await prisma.settings.count();
  if (count > 0) {
    console.log(`Settings already exist (${count}), skipping`);
    return;
  }

  await prisma.settings.create({
    data: {
      taxMode: 'exclusive',
      autoStartTime: '06:00',
      businessDayEndHour: '06:00',
      autoCloseEnabled: false,
      defaultTaxRateId,
      businessName: 'The Velvet Lounge',
      businessAddress: '42 Via Roma',
      businessCity: 'Milan',
      businessPostalCode: '20121',
      businessCountry: 'Italy',
      businessPhone: '+39 02 1234567',
      businessEmail: 'info@thevelvetlounge.it',
      vatNumber: 'IT12345678901',
      receiptPrefix: 'R',
      receiptNumberLength: 6,
      receiptStartNumber: 1,
      receiptSequenceYear: false,
      receiptCurrentNumber: 0,
    },
  });
  console.log('Created settings');
}

// ─── Tills ───────────────────────────────────────────────────────────

async function seedTills() {
  const count = await prisma.till.count();
  if (count > 0) {
    console.log(`Tills already exist (${count}), skipping`);
    return prisma.till.findMany({ orderBy: { id: 'asc' } });
  }

  const tills = [
    await prisma.till.create({ data: { name: 'Main Bar' } }),
    await prisma.till.create({ data: { name: 'Patio' } }),
  ];
  console.log(`Created ${tills.length} tills`);
  return tills;
}

// ─── Categories ──────────────────────────────────────────────────────

async function seedCategories() {
  const count = await prisma.category.count({ where: { id: { gt: 0 } } });
  if (count > 0) {
    console.log(`Categories already exist (${count}), skipping`);
    return prisma.category.findMany({ orderBy: { id: 'asc' } });
  }

  const names = ['Wine', 'Beer', 'Cocktails', 'Spirits', 'Soft Drinks', 'Coffee'];
  const cats = [];
  for (const name of names) {
    cats.push(await prisma.category.create({ data: { name, visibleTillIds: [] } }));
  }
  console.log(`Created ${cats.length} categories`);
  return cats;
}

// ─── Products & Variants ────────────────────────────────────────────

interface VariantRecord {
  id: number;
  productId: number;
  name: string;
  productName: string;
  price: Prisma.Decimal;
}

async function seedProductsAndVariants(
  categories: Awaited<ReturnType<typeof prisma.category.findMany>>
): Promise<VariantRecord[]> {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log(`Products already exist (${count}), skipping`);
    const rows = await prisma.productVariant.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });
    return rows.map((v) => ({
      id: v.id,
      productId: v.productId,
      name: v.name,
      productName: v.product.name,
      price: v.price,
    }));
  }

  const catMap = new Map(categories.map((c) => [c.name, c.id]));

  const productDefs = [
    {
      name: 'Chianti Classico', category: 'Wine',
      variants: [
        { name: 'Glass', price: '7.00', isFavourite: true, themeColor: 'red' },
        { name: 'Bottle', price: '28.00', isFavourite: false, themeColor: 'slate' },
      ],
    },
    {
      name: 'Prosecco', category: 'Wine',
      variants: [
        { name: 'Glass', price: '6.50', isFavourite: false, themeColor: 'slate' },
        { name: 'Bottle', price: '24.00', isFavourite: false, themeColor: 'slate' },
      ],
    },
    {
      name: 'Lager', category: 'Beer',
      variants: [
        { name: 'Draft', price: '5.00', isFavourite: true, themeColor: 'amber' },
        { name: 'Bottle', price: '4.50', isFavourite: false, themeColor: 'slate' },
      ],
    },
    {
      name: 'IPA', category: 'Beer',
      variants: [
        { name: 'Draft', price: '6.00', isFavourite: true, themeColor: 'amber' },
        { name: 'Bottle', price: '5.50', isFavourite: false, themeColor: 'slate' },
      ],
    },
    {
      name: 'Negroni', category: 'Cocktails',
      variants: [
        { name: 'Regular', price: '11.00', isFavourite: true, themeColor: 'red' },
      ],
    },
    {
      name: 'Mojito', category: 'Cocktails',
      variants: [
        { name: 'Regular', price: '10.00', isFavourite: false, themeColor: 'green' },
      ],
    },
    {
      name: 'Espresso Martini', category: 'Cocktails',
      variants: [
        { name: 'Regular', price: '12.00', isFavourite: true, themeColor: 'purple' },
      ],
    },
    {
      name: 'Jameson', category: 'Spirits',
      variants: [
        { name: 'Neat', price: '7.00', isFavourite: false, themeColor: 'amber' },
        { name: 'On the Rocks', price: '7.50', isFavourite: false, themeColor: 'amber' },
      ],
    },
    {
      name: "Jack Daniel's", category: 'Spirits',
      variants: [
        { name: 'Neat', price: '7.50', isFavourite: true, themeColor: 'amber' },
        { name: 'On the Rocks', price: '8.00', isFavourite: false, themeColor: 'slate' },
      ],
    },
    {
      name: 'Coca Cola', category: 'Soft Drinks',
      variants: [
        { name: 'Glass', price: '3.00', isFavourite: false, themeColor: 'red' },
      ],
    },
    {
      name: 'Sparkling Water', category: 'Soft Drinks',
      variants: [
        { name: 'Bottle', price: '2.50', isFavourite: false, themeColor: 'blue' },
      ],
    },
    {
      name: 'Espresso', category: 'Coffee',
      variants: [
        { name: 'Single', price: '2.00', isFavourite: true, themeColor: 'amber' },
        { name: 'Double', price: '3.00', isFavourite: false, themeColor: 'slate' },
      ],
    },
    {
      name: 'Americano', category: 'Coffee',
      variants: [
        { name: 'Regular', price: '2.50', isFavourite: false, themeColor: 'slate' },
      ],
    },
  ];

  const allVariants: VariantRecord[] = [];

  for (const pDef of productDefs) {
    const catId = catMap.get(pDef.category);
    if (!catId) continue;

    const product = await prisma.product.create({
      data: { name: pDef.name, categoryId: catId },
    });

    for (const vDef of pDef.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: vDef.name,
          price: D(vDef.price),
          isFavourite: vDef.isFavourite,
          themeColor: vDef.themeColor,
        },
      });
      allVariants.push({
        id: variant.id,
        productId: product.id,
        name: variant.name,
        productName: pDef.name,
        price: variant.price,
      });
    }
  }

  console.log(`Created ${productDefs.length} products with ${allVariants.length} variants`);
  return allVariants;
}

// ─── Stock Items ─────────────────────────────────────────────────────

async function seedStockItems() {
  const count = await prisma.stockItem.count();
  if (count > 0) {
    console.log(`StockItems already exist (${count}), skipping`);
    return;
  }

  const items = [
    { id: STOCK_IDS.vodka, name: 'Vodka', quantity: 500, type: 'Ingredient' as const, baseUnit: 'cl', standardCost: D('0.800000') },
    { id: STOCK_IDS.gin, name: 'Gin', quantity: 400, type: 'Ingredient' as const, baseUnit: 'cl', standardCost: D('1.200000') },
    { id: STOCK_IDS.rum, name: 'Rum', quantity: 350, type: 'Ingredient' as const, baseUnit: 'cl', standardCost: D('0.900000') },
    { id: STOCK_IDS.campari, name: 'Campari', quantity: 300, type: 'Ingredient' as const, baseUnit: 'cl', standardCost: D('1.100000') },
    { id: STOCK_IDS.sweetVermouth, name: 'Sweet Vermouth', quantity: 200, type: 'Ingredient' as const, baseUnit: 'cl', standardCost: D('0.600000') },
    { id: STOCK_IDS.limeJuice, name: 'Lime Juice', quantity: 2000, type: 'Ingredient' as const, baseUnit: 'ml', standardCost: D('0.020000') },
    { id: STOCK_IDS.mintLeaves, name: 'Mint Leaves', quantity: 500, type: 'Ingredient' as const, baseUnit: 'g', standardCost: D('0.030000') },
    { id: STOCK_IDS.coffeeBeans, name: 'Coffee Beans', quantity: 5000, type: 'Ingredient' as const, baseUnit: 'g', standardCost: D('0.040000') },
    { id: STOCK_IDS.sugarSyrup, name: 'Sugar Syrup', quantity: 3000, type: 'Ingredient' as const, baseUnit: 'ml', standardCost: D('0.010000') },
    {
      id: STOCK_IDS.beerKegLager, name: 'Beer Keg Lager', quantity: 5000, type: 'Ingredient' as const, baseUnit: 'cl',
      standardCost: D('0.150000'),
      purchasingUnits: JSON.stringify([{ id: 'pu-lager-keg', name: 'Keg (50L)', multiplier: 5000 }]),
    },
    {
      id: STOCK_IDS.beerKegIpa, name: 'Beer Keg IPA', quantity: 3000, type: 'Ingredient' as const, baseUnit: 'cl',
      standardCost: D('0.200000'),
      purchasingUnits: JSON.stringify([{ id: 'pu-ipa-keg', name: 'Keg (30L)', multiplier: 3000 }]),
    },
    { id: STOCK_IDS.cocaColaCan, name: 'Coca Cola Can', quantity: 120, type: 'Sellable Good' as const, baseUnit: 'unit', standardCost: D('0.800000') },
    { id: STOCK_IDS.sparklingWaterBottle, name: 'Sparkling Water Bottle', quantity: 80, type: 'Sellable Good' as const, baseUnit: 'unit', standardCost: D('0.500000') },
    { id: STOCK_IDS.wineBottleChianti, name: 'Wine Bottle Chianti', quantity: 48, type: 'Sellable Good' as const, baseUnit: 'unit', standardCost: D('9.500000') },
    { id: STOCK_IDS.wineBottleProsecco, name: 'Wine Bottle Prosecco', quantity: 36, type: 'Sellable Good' as const, baseUnit: 'unit', standardCost: D('7.800000') },
  ];

  for (const item of items) {
    await prisma.stockItem.create({
      data: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        type: item.type,
        baseUnit: item.baseUnit,
        standardCost: item.standardCost,
        costPerUnit: item.standardCost,
        lastCostUpdate: new Date('2026-04-15'),
        purchasingUnits: (item as any).purchasingUnits ?? undefined,
      },
    });
  }

  console.log(`Created ${items.length} stock items`);
}

// ─── Stock Consumption (recipes) ─────────────────────────────────────

async function seedStockConsumption(variants: VariantRecord[]) {
  const count = await prisma.stockConsumption.count();
  if (count > 0) {
    console.log(`StockConsumption already exist (${count}), skipping`);
    return;
  }

  // Build lookup: "ProductName VariantName" -> variant id
  const vMap = new Map(variants.map((v) => [`${v.productName} ${v.name}`, v.id]));

  const links: { key: string; stockItemId: string; quantity: number }[] = [
    // Negroni: 3cl gin, 3cl campari, 3cl sweet vermouth
    { key: 'Negroni Regular', stockItemId: STOCK_IDS.gin, quantity: 3 },
    { key: 'Negroni Regular', stockItemId: STOCK_IDS.campari, quantity: 3 },
    { key: 'Negroni Regular', stockItemId: STOCK_IDS.sweetVermouth, quantity: 3 },
    // Mojito: 5cl rum, 20ml lime juice, 15ml sugar syrup, 8g mint
    { key: 'Mojito Regular', stockItemId: STOCK_IDS.rum, quantity: 5 },
    { key: 'Mojito Regular', stockItemId: STOCK_IDS.limeJuice, quantity: 20 },
    { key: 'Mojito Regular', stockItemId: STOCK_IDS.sugarSyrup, quantity: 15 },
    { key: 'Mojito Regular', stockItemId: STOCK_IDS.mintLeaves, quantity: 8 },
    // Espresso Martini: 4cl vodka, 15g coffee, 10ml sugar syrup
    { key: 'Espresso Martini Regular', stockItemId: STOCK_IDS.vodka, quantity: 4 },
    { key: 'Espresso Martini Regular', stockItemId: STOCK_IDS.coffeeBeans, quantity: 15 },
    { key: 'Espresso Martini Regular', stockItemId: STOCK_IDS.sugarSyrup, quantity: 10 },
    // Lager Draft: 50cl from keg
    { key: 'Lager Draft', stockItemId: STOCK_IDS.beerKegLager, quantity: 50 },
    // IPA Draft: 50cl from keg
    { key: 'IPA Draft', stockItemId: STOCK_IDS.beerKegIpa, quantity: 50 },
    // Coca Cola Glass: 1 can
    { key: 'Coca Cola Glass', stockItemId: STOCK_IDS.cocaColaCan, quantity: 1 },
    // Sparkling Water Bottle: 1 bottle
    { key: 'Sparkling Water Bottle', stockItemId: STOCK_IDS.sparklingWaterBottle, quantity: 1 },
    // Espresso Single: 14g coffee beans
    { key: 'Espresso Single', stockItemId: STOCK_IDS.coffeeBeans, quantity: 14 },
    // Espresso Double: 18g coffee beans
    { key: 'Espresso Double', stockItemId: STOCK_IDS.coffeeBeans, quantity: 18 },
    // Americano Regular: 14g coffee beans
    { key: 'Americano Regular', stockItemId: STOCK_IDS.coffeeBeans, quantity: 14 },
  ];

  let created = 0;
  for (const link of links) {
    const variantId = vMap.get(link.key);
    if (!variantId) {
      console.warn(`Variant not found for key: ${link.key}`);
      continue;
    }
    await prisma.stockConsumption.create({
      data: {
        variantId,
        stockItemId: link.stockItemId,
        quantity: link.quantity,
      },
    });
    created++;
  }

  console.log(`Created ${created} stock consumption links`);
}

// ─── Stock Adjustments ───────────────────────────────────────────────

async function seedStockAdjustments(adminUser: { id: number; name: string }) {
  const count = await prisma.stockAdjustment.count();
  if (count > 0) {
    console.log(`StockAdjustments already exist (${count}), skipping`);
    return;
  }

  const adjustments = [
    { itemName: 'Gin', quantity: 100, reason: 'Restocked from supplier', stockItemId: STOCK_IDS.gin },
    { itemName: 'Vodka', quantity: 200, reason: 'Weekly delivery', stockItemId: STOCK_IDS.vodka },
    { itemName: 'Coffee Beans', quantity: -500, reason: 'Spillage during storage', stockItemId: STOCK_IDS.coffeeBeans },
  ];

  for (const adj of adjustments) {
    await prisma.stockAdjustment.create({
      data: {
        itemName: adj.itemName,
        quantity: adj.quantity,
        reason: adj.reason,
        userId: adminUser.id,
        userName: adminUser.name,
        stockItemId: adj.stockItemId,
        createdAt: new Date('2026-04-18T10:00:00Z'),
      },
    });
  }

  console.log(`Created ${adjustments.length} stock adjustments`);
}

// ─── Cost History ────────────────────────────────────────────────────

async function seedCostHistory(adminUser: { id: number }) {
  const count = await prisma.costHistory.count();
  if (count > 0) {
    console.log(`CostHistory already exist (${count}), skipping`);
    return;
  }

  const entries = [
    {
      stockItemId: STOCK_IDS.gin, previousCost: D('1.100000'), newCost: D('1.200000'),
      changePercent: D('9.09'), reason: 'supplier', notes: 'Supplier price increase',
      effectiveFrom: new Date('2026-04-01'),
    },
    {
      stockItemId: STOCK_IDS.coffeeBeans, previousCost: D('0.035000'), newCost: D('0.040000'),
      changePercent: D('14.29'), reason: 'supplier', notes: 'New harvest season pricing',
      effectiveFrom: new Date('2026-04-10'),
    },
    {
      stockItemId: STOCK_IDS.beerKegLager, previousCost: D('0.140000'), newCost: D('0.150000'),
      changePercent: D('7.14'), reason: 'adjustment', notes: 'Quarterly cost review',
      effectiveFrom: new Date('2026-04-15'),
    },
  ];

  for (const e of entries) {
    await prisma.costHistory.create({
      data: {
        stockItemId: e.stockItemId,
        previousCost: e.previousCost,
        newCost: e.newCost,
        changePercent: e.changePercent,
        reason: e.reason,
        notes: e.notes,
        effectiveFrom: e.effectiveFrom,
        createdBy: adminUser.id,
      },
    });
  }

  console.log(`Created ${entries.length} cost history entries`);
}

// ─── Rooms & Tables ──────────────────────────────────────────────────

async function seedRoomsAndTables(adminUser: { id: number }) {
  const roomCount = await prisma.room.count();
  if (roomCount > 0) {
    console.log(`Rooms already exist (${roomCount}), skipping`);
    return;
  }

  // Create rooms
  const mainHall = await prisma.room.create({
    data: { name: 'Main Hall', description: 'Indoor dining area' },
  });
  const terrace = await prisma.room.create({
    data: { name: 'Terrace', description: 'Outdoor seating' },
  });

  // Create tables in Main Hall (4 tables)
  const mainHallTables = [
    { name: 'Table 1', x: 0.05, y: 0.05, width: 0.2, height: 0.3, capacity: 4 },
    { name: 'Table 2', x: 0.28, y: 0.05, width: 0.2, height: 0.3, capacity: 4 },
    { name: 'Table 3', x: 0.05, y: 0.4, width: 0.2, height: 0.3, capacity: 6 },
    { name: 'Table 4', x: 0.28, y: 0.4, width: 0.2, height: 0.3, capacity: 2 },
  ];

  for (const t of mainHallTables) {
    await prisma.table.create({
      data: {
        name: t.name,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        capacity: t.capacity,
        status: 'available',
        roomId: mainHall.id,
      },
    });
  }

  // Create tables on Terrace (2 tables)
  const terraceTables = [
    { name: 'Terrace A', x: 0.05, y: 0.05, width: 0.25, height: 0.35, capacity: 6 },
    { name: 'Terrace B', x: 0.35, y: 0.05, width: 0.25, height: 0.35, capacity: 4, status: 'occupied' as const },
  ];

  for (const t of terraceTables) {
    await prisma.table.create({
      data: {
        name: t.name,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        capacity: t.capacity,
        status: t.status || 'available',
        roomId: terrace.id,
        ...(t.status === 'occupied' ? { ownerId: adminUser.id } : {}),
      },
    });
  }

  console.log(`Created 2 rooms with ${mainHallTables.length + terraceTables.length} tables`);
}

// ─── Customers ───────────────────────────────────────────────────────

async function seedCustomers(adminUser: { id: number }) {
  const count = await prisma.customer.count();
  if (count > 0) {
    console.log(`Customers already exist (${count}), skipping`);
    return prisma.customer.findMany({ orderBy: { id: 'asc' } });
  }

  const customers = [
    {
      name: 'Acme Events Srl',
      email: 'billing@acme-events.it',
      phone: '+39 02 9876543',
      vatNumber: 'IT98765432100',
      address: '15 Corso Buenos Aires',
      city: 'Milan',
      postalCode: '20124',
      country: 'Italy',
      notes: 'Corporate client - monthly invoicing',
    },
    {
      name: 'Marco Rossi',
      phone: '+39 333 1234567',
    },
    {
      name: 'Hotel Bellavista',
      email: 'events@bellavista.it',
      phone: '+39 0341 555666',
      vatNumber: 'IT11223344556',
      address: '8 Via Lungolago',
      city: 'Como',
      postalCode: '22100',
      country: 'Italy',
      notes: 'Regular bookings for guest events',
    },
  ];

  for (const c of customers) {
    await prisma.customer.create({
      data: {
        name: c.name,
        email: (c as any).email ?? null,
        phone: c.phone ?? null,
        vatNumber: (c as any).vatNumber ?? null,
        address: (c as any).address ?? null,
        city: (c as any).city ?? null,
        postalCode: (c as any).postalCode ?? null,
        country: (c as any).country ?? null,
        notes: (c as any).notes ?? null,
        isActive: true,
        createdBy: adminUser.id,
      },
    });
  }

  console.log(`Created ${customers.length} customers`);
  return prisma.customer.findMany({ orderBy: { id: 'asc' } });
}

// ─── Variant Layouts ─────────────────────────────────────────────────

async function seedVariantLayouts(
  tills: Awaited<ReturnType<typeof prisma.till.findMany>>,
  categories: Awaited<ReturnType<typeof prisma.category.findMany>>,
  variants: VariantRecord[],
) {
  const count = await prisma.variantLayout.count();
  if (count > 0) {
    console.log(`VariantLayouts already exist (${count}), skipping`);
    return;
  }

  if (tills.length === 0 || categories.length === 0 || variants.length === 0) return;

  const mainBar = tills[0];
  const catMap = new Map(categories.map((c) => [c.name, c.id]));

  // Place favourite and some regular variants in a grid on the Main Bar till
  interface LayoutEntry {
    product: string;
    variant: string;
    category: string;
    col: number;
    row: number;
  }

  const layouts: LayoutEntry[] = [
    // Wine row 1
    { product: 'Chianti Classico', variant: 'Glass', category: 'Wine', col: 1, row: 1 },
    { product: 'Prosecco', variant: 'Glass', category: 'Wine', col: 2, row: 1 },
    // Beer row 2
    { product: 'Lager', variant: 'Draft', category: 'Beer', col: 1, row: 2 },
    { product: 'IPA', variant: 'Draft', category: 'Beer', col: 2, row: 2 },
    // Cocktails row 3
    { product: 'Negroni', variant: 'Regular', category: 'Cocktails', col: 1, row: 3 },
    { product: 'Espresso Martini', variant: 'Regular', category: 'Cocktails', col: 2, row: 3 },
    { product: 'Mojito', variant: 'Regular', category: 'Cocktails', col: 3, row: 3 },
    // Spirits row 4
    { product: "Jack Daniel's", variant: 'Neat', category: 'Spirits', col: 1, row: 4 },
    { product: 'Jameson', variant: 'On the Rocks', category: 'Spirits', col: 2, row: 4 },
    // Soft Drinks row 5
    { product: 'Coca Cola', variant: 'Glass', category: 'Soft Drinks', col: 1, row: 5 },
    { product: 'Sparkling Water', variant: 'Bottle', category: 'Soft Drinks', col: 2, row: 5 },
    // Coffee row 6
    { product: 'Espresso', variant: 'Single', category: 'Coffee', col: 1, row: 6 },
    { product: 'Americano', variant: 'Regular', category: 'Coffee', col: 2, row: 6 },
  ];

  let created = 0;
  for (const l of layouts) {
    const variant = variants.find(
      (v) => v.productName === l.product && v.name === l.variant
    );
    const categoryId = catMap.get(l.category);
    if (!variant || !categoryId) continue;

    await prisma.variantLayout.create({
      data: {
        tillId: mainBar.id,
        categoryId,
        variantId: variant.id,
        gridColumn: l.col,
        gridRow: l.row,
      },
    });
    created++;
  }

  console.log(`Created ${created} variant layouts`);
}

// ─── Transactions ────────────────────────────────────────────────────

async function seedTransactions(
  users: Awaited<ReturnType<typeof prisma.user.findMany>>,
  tills: Awaited<ReturnType<typeof prisma.till.findMany>>,
  variants: VariantRecord[],
) {
  const count = await prisma.transaction.count();
  if (count > 0) {
    console.log(`Transactions already exist (${count}), skipping`);
    return prisma.transaction.findMany({ orderBy: { id: 'asc' } });
  }

  if (users.length === 0 || tills.length === 0 || variants.length === 0) {
    return [];
  }

  const cashier = users.find((u) => u.role === 'Cashier') || users[0];
  const admin = users.find((u) => u.role === 'Admin') || users[0];
  const mainBar = tills[0];

  // Helper to find variant by product+variant name
  const findV = (product: string, variant: string) =>
    variants.find((v) => v.productName === product && v.name === variant)!;

  // Transaction 1: Card payment - cocktails and drinks
  const tx1Items = [
    { ...findV('Negroni', 'Regular'), quantity: 2, effectiveTaxRate: 0.19 },
    { ...findV('IPA', 'Draft'), quantity: 1, effectiveTaxRate: 0.19 },
    { ...findV('Espresso Martini', 'Regular'), quantity: 1, effectiveTaxRate: 0.19 },
  ];
  const tx1Subtotal = D(22.00).add(D(6.00)).add(D(12.00)); // 40.00
  const tx1Tax = D(7.60); // 40 * 0.19
  const tx1Total = D(47.60);

  const tx1 = await prisma.transaction.create({
    data: {
      items: JSON.stringify(tx1Items.map((i) => ({
        id: i.id,
        variantId: i.id,
        productId: i.productId,
        name: `${i.productName} ${i.name}`,
        price: i.price.toNumber(),
        quantity: i.quantity,
        effectiveTaxRate: i.effectiveTaxRate,
      }))),
      subtotal: tx1Subtotal,
      tax: tx1Tax,
      tip: D(3.00),
      total: tx1Total.add(D(3.00)),
      discount: D(0),
      status: 'completed',
      paymentMethod: 'card',
      userId: cashier.id,
      userName: cashier.name,
      tillId: mainBar.id,
      tillName: mainBar.name,
      idempotencyKey: 'seed-tx-1',
      idempotencyCreatedAt: new Date('2026-04-21T14:30:00Z'),
      createdAt: new Date('2026-04-21T14:30:00Z'),
      totalCost: D(14.10),
      costCalculatedAt: new Date('2026-04-21T14:30:00Z'),
      grossMargin: D(33.50),
      marginPercent: D('70.59'),
    },
  });

  for (const i of tx1Items) {
    await prisma.transactionItem.create({
      data: {
        transactionId: tx1.id,
        productId: i.productId,
        variantId: i.id,
        productName: i.productName,
        variantName: i.name,
        price: i.price,
        quantity: i.quantity,
        effectiveTaxRate: D(i.effectiveTaxRate),
      },
    });
  }

  // Transaction 2: Cash payment - beers and wine
  const tx2Items = [
    { ...findV('Lager', 'Draft'), quantity: 3, effectiveTaxRate: 0.19 },
    { ...findV('Chianti Classico', 'Glass'), quantity: 2, effectiveTaxRate: 0.19 },
    { ...findV('Sparkling Water', 'Bottle'), quantity: 2, effectiveTaxRate: 0.19 },
  ];
  const tx2Subtotal = D(15.00).add(D(14.00)).add(D(5.00)); // 34.00
  const tx2Tax = D(6.46); // 34 * 0.19
  const tx2Total = D(40.46);

  const tx2 = await prisma.transaction.create({
    data: {
      items: JSON.stringify(tx2Items.map((i) => ({
        id: i.id,
        variantId: i.id,
        productId: i.productId,
        name: `${i.productName} ${i.name}`,
        price: i.price.toNumber(),
        quantity: i.quantity,
        effectiveTaxRate: i.effectiveTaxRate,
      }))),
      subtotal: tx2Subtotal,
      tax: tx2Tax,
      tip: D(0),
      total: tx2Total,
      discount: D(0),
      status: 'completed',
      paymentMethod: 'cash',
      userId: admin.id,
      userName: admin.name,
      tillId: mainBar.id,
      tillName: mainBar.name,
      idempotencyKey: 'seed-tx-2',
      idempotencyCreatedAt: new Date('2026-04-21T18:15:00Z'),
      createdAt: new Date('2026-04-21T18:15:00Z'),
    },
  });

  for (const i of tx2Items) {
    await prisma.transactionItem.create({
      data: {
        transactionId: tx2.id,
        productId: i.productId,
        variantId: i.id,
        productName: i.productName,
        variantName: i.name,
        price: i.price,
        quantity: i.quantity,
        effectiveTaxRate: D(i.effectiveTaxRate),
      },
    });
  }

  // Transaction 3: Card payment - spirits and coffee
  const tx3Items = [
    { ...findV("Jack Daniel's", 'Neat'), quantity: 2, effectiveTaxRate: 0.19 },
    { ...findV('Jameson', 'On the Rocks'), quantity: 1, effectiveTaxRate: 0.19 },
    { ...findV('Espresso', 'Double'), quantity: 2, effectiveTaxRate: 0.19 },
  ];
  const tx3Subtotal = D(15.00).add(D(7.50)).add(D(6.00)); // 28.50
  const tx3Tax = D(5.42); // 28.50 * 0.19 ≈ 5.415
  const tx3Total = D(33.92);

  const tx3 = await prisma.transaction.create({
    data: {
      items: JSON.stringify(tx3Items.map((i) => ({
        id: i.id,
        variantId: i.id,
        productId: i.productId,
        name: `${i.productName} ${i.name}`,
        price: i.price.toNumber(),
        quantity: i.quantity,
        effectiveTaxRate: i.effectiveTaxRate,
      }))),
      subtotal: tx3Subtotal,
      tax: tx3Tax,
      tip: D(2.00),
      total: tx3Total.add(D(2.00)),
      discount: D(0),
      status: 'completed',
      paymentMethod: 'card',
      userId: cashier.id,
      userName: cashier.name,
      tillId: mainBar.id,
      tillName: mainBar.name,
      idempotencyKey: 'seed-tx-3',
      idempotencyCreatedAt: new Date('2026-04-22T09:45:00Z'),
      createdAt: new Date('2026-04-22T09:45:00Z'),
    },
  });

  for (const i of tx3Items) {
    await prisma.transactionItem.create({
      data: {
        transactionId: tx3.id,
        productId: i.productId,
        variantId: i.id,
        productName: i.productName,
        variantName: i.name,
        price: i.price,
        quantity: i.quantity,
        effectiveTaxRate: D(i.effectiveTaxRate),
      },
    });
  }

  console.log(`Created 3 transactions with items`);
  return prisma.transaction.findMany({ orderBy: { id: 'asc' } });
}

// ─── Inventory Counts ────────────────────────────────────────────────

async function seedInventoryCounts(
  adminUser: { id: number },
) {
  const count = await prisma.inventoryCount.count();
  if (count > 0) {
    console.log(`InventoryCounts already exist (${count}), skipping`);
    return;
  }

  // One approved full count
  const invCount = await prisma.inventoryCount.create({
    data: {
      countDate: new Date('2026-04-20'),
      countType: 'full',
      status: 'approved',
      submittedAt: new Date('2026-04-20T16:00:00Z'),
      approvedAt: new Date('2026-04-20T17:00:00Z'),
      approvedBy: adminUser.id,
      notes: 'Monthly full inventory count',
      createdBy: adminUser.id,
      createdAt: new Date('2026-04-20T14:00:00Z'),
    },
  });

  const countItems = [
    { stockItemId: STOCK_IDS.gin, quantity: D('380.00'), unitCost: D('1.200000'), extendedValue: D('456.000000') },
    { stockItemId: STOCK_IDS.vodka, quantity: D('480.00'), unitCost: D('0.800000'), extendedValue: D('384.000000') },
    { stockItemId: STOCK_IDS.rum, quantity: D('320.00'), unitCost: D('0.900000'), extendedValue: D('288.000000') },
    { stockItemId: STOCK_IDS.campari, quantity: D('280.00'), unitCost: D('1.100000'), extendedValue: D('308.000000') },
    { stockItemId: STOCK_IDS.coffeeBeans, quantity: D('4500.00'), unitCost: D('0.040000'), extendedValue: D('180.000000') },
    { stockItemId: STOCK_IDS.beerKegLager, quantity: D('4800.00'), unitCost: D('0.150000'), extendedValue: D('720.000000') },
    { stockItemId: STOCK_IDS.cocaColaCan, quantity: D('110.00'), unitCost: D('0.800000'), extendedValue: D('88.000000') },
  ];

  for (const item of countItems) {
    await prisma.inventoryCountItem.create({
      data: {
        inventoryCountId: invCount.id,
        stockItemId: item.stockItemId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        extendedValue: item.extendedValue,
      },
    });
  }

  console.log(`Created 1 approved inventory count with ${countItems.length} items`);
}

// ─── Variance Reports ────────────────────────────────────────────────

async function seedVarianceReports(
  adminUser: { id: number },
) {
  const count = await prisma.varianceReport.count();
  if (count > 0) {
    console.log(`VarianceReports already exist (${count}), skipping`);
    return;
  }

  const report = await prisma.varianceReport.create({
    data: {
      periodStart: new Date('2026-04-01'),
      periodEnd: new Date('2026-04-20'),
      status: 'reviewed',
      theoreticalCost: D('2850.500000'),
      actualCost: D('2924.000000'),
      varianceValue: D('73.500000'),
      variancePercent: D('2.58'),
      createdBy: adminUser.id,
      createdAt: new Date('2026-04-20T18:00:00Z'),
      reviewedAt: new Date('2026-04-21T10:00:00Z'),
      reviewedBy: adminUser.id,
    },
  });

  const items = [
    {
      stockItemId: STOCK_IDS.gin, theoreticalQty: D('400.00'), actualQty: D('380.00'),
      varianceQty: D('-20.00'), unitCost: D('1.200000'), varianceValue: D('-24.000000'),
      variancePercent: D('-5.00'), status: 'warning' as const, notes: 'Slight over-pouring suspected',
    },
    {
      stockItemId: STOCK_IDS.vodka, theoreticalQty: D('500.00'), actualQty: D('480.00'),
      varianceQty: D('-20.00'), unitCost: D('0.800000'), varianceValue: D('-16.000000'),
      variancePercent: D('-4.00'), status: 'ok' as const,
    },
    {
      stockItemId: STOCK_IDS.rum, theoreticalQty: D('340.00'), actualQty: D('320.00'),
      varianceQty: D('-20.00'), unitCost: D('0.900000'), varianceValue: D('-18.000000'),
      variancePercent: D('-5.88'), status: 'warning' as const,
    },
    {
      stockItemId: STOCK_IDS.coffeeBeans, theoreticalQty: D('5000.00'), actualQty: D('4500.00'),
      varianceQty: D('-500.00'), unitCost: D('0.040000'), varianceValue: D('-20.000000'),
      variancePercent: D('-10.00'), status: 'critical' as const, notes: 'Spillage incident on Apr 12',
    },
    {
      stockItemId: STOCK_IDS.cocaColaCan, theoreticalQty: D('120.00'), actualQty: D('110.00'),
      varianceQty: D('-10.00'), unitCost: D('0.800000'), varianceValue: D('-8.000000'),
      variancePercent: D('-8.33'), status: 'ok' as const,
    },
  ];

  for (const item of items) {
    await prisma.varianceReportItem.create({
      data: {
        varianceReportId: report.id,
        stockItemId: item.stockItemId,
        theoreticalQty: item.theoreticalQty,
        actualQty: item.actualQty,
        varianceQty: item.varianceQty,
        unitCost: item.unitCost,
        varianceValue: item.varianceValue,
        variancePercent: item.variancePercent,
        status: item.status,
        notes: (item as any).notes ?? null,
      },
    });
  }

  console.log(`Created 1 reviewed variance report with ${items.length} items`);
}

// ─── Daily Closing ───────────────────────────────────────────────────

async function seedDailyClosings(adminUser: { id: number }) {
  const count = await prisma.dailyClosing.count();
  if (count > 0) {
    console.log(`DailyClosings already exist (${count}), skipping`);
    return;
  }

  await prisma.dailyClosing.create({
    data: {
      createdAt: new Date('2026-04-21T06:00:00Z'),
      closedAt: new Date('2026-04-21T06:05:00Z'),
      summary: JSON.stringify({
        date: '2026-04-20',
        totalRevenue: 121.98,
        totalTransactions: 2,
        paymentBreakdown: { card: 50.60, cash: 40.46 },
        avgTransaction: 60.99,
      }),
      userId: adminUser.id,
    },
  });

  console.log('Created 1 daily closing');
}

// ─── Receipts ────────────────────────────────────────────────────────

async function seedReceipts(
  transactions: Awaited<ReturnType<typeof prisma.transaction.findMany>>,
  customers: Awaited<ReturnType<typeof prisma.customer.findMany>>,
  adminUser: { id: number; name: string },
) {
  const count = await prisma.receipt.count();
  if (count > 0) {
    console.log(`Receipts already exist (${count}), skipping`);
    return;
  }

  if (transactions.length === 0) return;

  const businessCustomer = customers.find((c) => c.name === 'Acme Events Srl');

  // Receipt 1: Issued receipt for transaction 1
  const receipt1Data: Prisma.ReceiptUncheckedCreateInput = {
    receiptNumber: 'R-000001',
    transactionId: transactions[0].id,
    customerId: businessCustomer?.id ?? null,
    status: 'issued',
    businessSnapshot: JSON.stringify({
      businessName: 'The Velvet Lounge',
      businessAddress: '42 Via Roma',
      businessCity: 'Milan',
      businessPostalCode: '20121',
      businessCountry: 'Italy',
      vatNumber: 'IT12345678901',
      businessPhone: '+39 02 1234567',
    }),
    customerSnapshot: businessCustomer
      ? JSON.stringify({
          name: businessCustomer.name,
          email: businessCustomer.email,
          vatNumber: businessCustomer.vatNumber,
          address: businessCustomer.address,
          city: businessCustomer.city,
        })
      : null,
    subtotal: D('40.00'),
    tax: D('7.60'),
    discount: D('0'),
    tip: D('3.00'),
    total: D('50.60'),
    paymentMethod: 'card',
    itemsSnapshot: JSON.stringify([
      { name: 'Negroni Regular', price: 11.00, quantity: 2, total: 22.00 },
      { name: 'IPA Draft', price: 6.00, quantity: 1, total: 6.00 },
      { name: 'Espresso Martini Regular', price: 12.00, quantity: 1, total: 12.00 },
    ]),
    issuedAt: new Date('2026-04-21T14:31:00Z'),
    issuedBy: adminUser.id,
    issuedFromPaymentModal: true,
    generationStatus: 'pending',
    generationAttempts: 0,
    version: 0,
    createdAt: new Date('2026-04-21T14:30:00Z'),
    updatedAt: new Date('2026-04-21T14:31:00Z'),
  };
  await prisma.receipt.create({ data: receipt1Data });

  // Receipt 2: Draft receipt for transaction 2
  const receipt2Data: Prisma.ReceiptUncheckedCreateInput = {
    receiptNumber: 'R-000002',
    transactionId: transactions[1].id,
    status: 'draft',
    businessSnapshot: JSON.stringify({
      businessName: 'The Velvet Lounge',
      businessAddress: '42 Via Roma',
      businessCity: 'Milan',
      businessPostalCode: '20121',
      businessCountry: 'Italy',
      vatNumber: 'IT12345678901',
      businessPhone: '+39 02 1234567',
    }),
    customerSnapshot: null,
    subtotal: D('34.00'),
    tax: D('6.46'),
    discount: D('0'),
    tip: D('0'),
    total: D('40.46'),
    paymentMethod: 'cash',
    itemsSnapshot: JSON.stringify([
      { name: 'Lager Draft', price: 5.00, quantity: 3, total: 15.00 },
      { name: 'Chianti Classico Glass', price: 7.00, quantity: 2, total: 14.00 },
      { name: 'Sparkling Water Bottle', price: 2.50, quantity: 2, total: 5.00 },
    ]),
    issuedBy: adminUser.id,
    issuedAt: null,
    generationStatus: 'pending',
    generationAttempts: 0,
    version: 0,
    createdAt: new Date('2026-04-21T18:15:00Z'),
    updatedAt: new Date('2026-04-21T18:15:00Z'),
  };
  await prisma.receipt.create({ data: receipt2Data });

  console.log('Created 2 receipts (1 issued, 1 draft)');
}

// ─── Main Seed Function ──────────────────────────────────────────────

async function seedDatabase() {
  try {
    console.log('Starting database seed...\n');

    const users = await seedUsers();
    const taxRates = await seedTaxRates();
    const defaultTaxRate = taxRates.find((t) => t.isDefault) || taxRates[0];
    await seedSettings(defaultTaxRate.id);
    const tills = await seedTills();
    const categories = await seedCategories();
    const variants = await seedProductsAndVariants(categories);

    const adminUser = users.find((u) => u.role === 'Admin') || users[0];

    await seedStockItems();
    await seedStockConsumption(variants);
    await seedStockAdjustments(adminUser);
    await seedCostHistory(adminUser);
    await seedRoomsAndTables(adminUser);
    const customers = await seedCustomers(adminUser);
    await seedVariantLayouts(tills, categories, variants);
    const transactions = await seedTransactions(users, tills, variants);
    await seedInventoryCounts(adminUser);
    await seedVarianceReports(adminUser);
    await seedDailyClosings(adminUser);
    await seedReceipts(transactions, customers, adminUser);

    console.log('\nDatabase seeding completed successfully!');
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
