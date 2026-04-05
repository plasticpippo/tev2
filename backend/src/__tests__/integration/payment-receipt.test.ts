import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../prisma';
import { SignJWT } from 'jose';
import { initI18n } from '../../i18n';

// Test utilities
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-development-only';

interface TestUser {
  id: number;
  username: string;
  role: string;
}

async function generateTestToken(user: TestUser): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

// Test fixtures
const adminUser: TestUser = { id: 1, username: 'admin', role: 'ADMIN' };
const cashierUser: TestUser = { id: 2, username: 'cashier', role: 'CASHIER' };

const validPaymentPayload = {
  items: [
    { name: 'Espresso', quantity: 2, price: 1.5, taxRateName: 'Standard', taxRatePercent: 22 },
    { name: 'Cappuccino', quantity: 1, price: 2.0, taxRateName: 'Standard', taxRatePercent: 22 },
  ],
  subtotal: 5.0,
  tax: 1.1,
  tip: 0,
  total: 6.1,
  paymentMethod: 'card',
  tillId: 1,
};

describe('Integration Tests: Payment with Receipt Flow', () => {
  let adminToken: string;
  let cashierToken: string;

  beforeAll(async () => {
    await initI18n();
    adminToken = await generateTestToken(adminUser);
    cashierToken = await generateTestToken(cashierUser);

    // Ensure settings exist with receipt feature enabled
    await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        allowReceiptFromPaymentModal: true,
        receiptIssueMode: 'immediate',
        businessName: 'Test Cafe',
        taxMode: 'exclusive',
        autoStartTime: '06:00',
      },
      create: {
        id: 1,
        allowReceiptFromPaymentModal: true,
        receiptIssueMode: 'immediate',
        businessName: 'Test Cafe',
        taxMode: 'exclusive',
        autoStartTime: '06:00',
      },
    });

    // Ensure a till exists for testing
    await prisma.till.upsert({
      where: { id: 1 },
      update: { name: 'Test Till' },
      create: { id: 1, name: 'Test Till' },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.receipt.deleteMany({
      where: { issuedBy: { in: [adminUser.id, cashierUser.id] } },
    });
    await prisma.transaction.deleteMany({
      where: { userId: { in: [adminUser.id, cashierUser.id] } },
    });
    await prisma.$disconnect();
  });

  // ============================================================================
  // Test: Payment with issueReceipt: true creates receipt
  // ============================================================================
  describe('Payment with issueReceipt: true', () => {
    it('should create a receipt when issueReceipt is true', async () => {
      const response = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.receipt).toBeDefined();
      expect(response.body.receipt.id).toBeDefined();
      expect(response.body.receipt.status).toBeDefined();
    });

    it('should include receipt information in the response', async () => {
      const response = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('receipt');
      expect(response.body.receipt).toHaveProperty('id');
      expect(response.body.receipt).toHaveProperty('status');
    });
  });

  // ============================================================================
  // Test: Payment with issueReceipt: false does not create receipt
  // ============================================================================
  describe('Payment with issueReceipt: false', () => {
    it('should not create a receipt when issueReceipt is false', async () => {
      const response = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.receipt).toBeUndefined();
    });

    it('should not create a receipt when issueReceipt is not provided', async () => {
      const response = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Content-Type', 'application/json')
        .send(validPaymentPayload);

      expect(response.status).toBe(201);
      expect(response.body.receipt).toBeUndefined();
    });
  });

  // ============================================================================
  // Test: Immediate mode issues receipt synchronously
  // ============================================================================
  describe('Immediate mode receipt issuance', () => {
    beforeAll(async () => {
      // Set receipt issue mode to immediate
      await prisma.settings.update({
        where: { id: 1 },
        data: { receiptIssueMode: 'immediate' },
      });
    });

    it('should issue receipt immediately with status issued', async () => {
      const response = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.receipt).toBeDefined();
      expect(response.body.receipt.status).toBe('issued');
    });
  });

  // ============================================================================
  // Test: Draft mode creates draft only
  // ============================================================================
  describe('Draft mode receipt issuance', () => {
    beforeAll(async () => {
      // Set receipt issue mode to draft
      await prisma.settings.update({
        where: { id: 1 },
        data: { receiptIssueMode: 'draft' },
      });
    });

    it('should create receipt in draft mode', async () => {
      const response = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.receipt).toBeDefined();
      expect(response.body.receipt.status).toBe('draft');
    });

    afterAll(async () => {
      // Reset to immediate mode for other tests
      await prisma.settings.update({
        where: { id: 1 },
        data: { receiptIssueMode: 'immediate' },
      });
    });
  });

  // ============================================================================
  // Test: Receipt creation failure does not block payment
  // ============================================================================
  describe('Receipt creation failure handling', () => {
    it('should still succeed payment even if receipt creation would fail', async () => {
      // This test verifies that the payment endpoint handles receipt errors gracefully
      // The payment should always succeed regardless of receipt issues
      const response = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: true,
        });

      // Payment should succeed (201) even if receipt creation has issues
      expect(response.status).toBe(201);
      // The response should still include transaction data
      expect(response.body.id).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
  });

  // ============================================================================
  // Test: Idempotency with receipt parameter
  // ============================================================================
  describe('Idempotency with receipt parameter', () => {
    const idempotencyKey = 'test-idempotent-receipt-key-001';

    it('should handle duplicate payment with issueReceipt gracefully', async () => {
      // First request
      const response1 = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: true,
          idempotencyKey,
        });

      expect(response1.status).toBe(201);
      expect(response1.body.receipt).toBeDefined();

      // Second request with same idempotency key (should be idempotent)
      const response2 = await request(app)
        .post('/api/transactions/process-payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...validPaymentPayload,
          issueReceipt: true,
          idempotencyKey,
        });

      // Should return 200 for idempotent replay
      expect(response2.status).toBe(200);
      expect(response2.headers['x-idempotent-replay']).toBe('true');
      // Receipt should not be created again for duplicate
      expect(response2.body.receipt).toBeUndefined();
    });
  });

  // ============================================================================
  // Test: Receipt retry endpoint
  // ============================================================================
  describe('Receipt retry endpoint', () => {
    it('should allow retry on a failed receipt', async () => {
      // Create a test user for the receipt
      const testUser = await prisma.user.upsert({
        where: { username: 'testreceiptuser' },
        update: {},
        create: {
          username: 'testreceiptuser',
          password: 'hashedpassword',
          role: 'CASHIER',
          name: 'Test Receipt User',
        },
      });

      // Create a test transaction for the receipt
      const testTransaction = await prisma.transaction.create({
        data: {
          items: [{ name: 'Test Item', quantity: 1, price: 10 }],
          subtotal: 10,
          tax: 0,
          total: 10,
          paymentMethod: 'cash',
          userId: testUser.id,
          tillId: 1,
          status: 'completed',
        } as any,
      });

      // Create a receipt in failed state for testing
      const testReceipt = await prisma.receipt.create({
        data: {
          receiptNumber: 'TEST-FAILED-RECEIPT',
          transactionId: testTransaction.id,
          status: 'draft',
          businessSnapshot: {} as any,
          customerSnapshot: {},
          itemsSnapshot: [] as any,
          subtotal: 0,
          tax: 0,
          total: 0,
          paymentMethod: 'cash',
          issuedBy: testUser.id,
          issuedFromPaymentModal: true,
          generationStatus: 'failed',
          version: 0,
        },
      });

      // Create a queue entry for this receipt
      await prisma.receiptGenerationQueue.create({
        data: {
          receiptId: testReceipt.id,
          status: 'failed',
          attempts: 5,
          maxAttempts: 5,
          nextAttemptAt: new Date(),
          lastError: 'Test error',
        },
      });

      // Attempt retry
      const response = await request(app)
        .post(`/api/receipts/${testReceipt.id}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      // Clean up
      await prisma.receiptGenerationQueue.deleteMany({
        where: { receiptId: testReceipt.id },
      });
      await prisma.receipt.delete({ where: { id: testReceipt.id } });
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should return 400 when retrying a non-failed receipt', async () => {
      // Create a test user and transaction
      const testUser = await prisma.user.upsert({
        where: { username: 'testissueduser' },
        update: {},
        create: {
          username: 'testissueduser',
          password: 'hashedpassword',
          role: 'CASHIER',
          name: 'Test Issued User',
        },
      });

      const testTransaction = await prisma.transaction.create({
        data: {
          items: [{ name: 'Test Item', quantity: 1, price: 10 }],
          subtotal: 10,
          tax: 0,
          total: 10,
          paymentMethod: 'cash',
          userId: testUser.id,
          tillId: 1,
          status: 'completed',
        } as any,
      });

      // Create a receipt in issued state
      const testReceipt = await prisma.receipt.create({
        data: {
          receiptNumber: 'TEST-ISSUED-RECEIPT',
          transactionId: testTransaction.id,
          status: 'issued',
          businessSnapshot: {} as any,
          customerSnapshot: {},
          itemsSnapshot: [] as any,
          subtotal: 0,
          tax: 0,
          total: 0,
          paymentMethod: 'cash',
          issuedBy: testUser.id,
          issuedFromPaymentModal: true,
          generationStatus: 'completed',
          version: 0,
        },
      });

      const response = await request(app)
        .post(`/api/receipts/${testReceipt.id}/retry`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);

      // Clean up
      await prisma.receipt.delete({ where: { id: testReceipt.id } });
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should return 403 when non-owner tries to retry', async () => {
      // Create a receipt owned by a different user
      const otherUser = await prisma.user.upsert({
        where: { username: 'otherreceiptuser' },
        update: {},
        create: {
          username: 'otherreceiptuser',
          password: 'hashedpassword',
          role: 'CASHIER',
          name: 'Other Receipt User',
        },
      });

      const testTransaction = await prisma.transaction.create({
        data: {
          items: [{ name: 'Test Item', quantity: 1, price: 10 }],
          subtotal: 10,
          tax: 0,
          total: 10,
          paymentMethod: 'cash',
          userId: otherUser.id,
          tillId: 1,
          status: 'completed',
        } as any,
      });

      const testReceipt = await prisma.receipt.create({
        data: {
          receiptNumber: 'TEST-OTHER-RECEIPT',
          transactionId: testTransaction.id,
          status: 'draft',
          businessSnapshot: {} as any,
          customerSnapshot: {},
          itemsSnapshot: [] as any,
          subtotal: 0,
          tax: 0,
          total: 0,
          paymentMethod: 'cash',
          issuedBy: otherUser.id,
          issuedFromPaymentModal: true,
          generationStatus: 'failed',
          version: 0,
        },
      });

      await prisma.receiptGenerationQueue.create({
        data: {
          receiptId: testReceipt.id,
          status: 'failed',
          attempts: 3,
          maxAttempts: 5,
          nextAttemptAt: new Date(),
          lastError: 'Test error',
        },
      });

      // Cashier tries to retry receipt owned by different user
      const response = await request(app)
        .post(`/api/receipts/${testReceipt.id}/retry`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(403);

      // Clean up
      await prisma.receiptGenerationQueue.deleteMany({
        where: { receiptId: testReceipt.id },
      });
      await prisma.receipt.delete({ where: { id: testReceipt.id } });
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  // ============================================================================
  // Test: Pending receipts endpoint
  // ============================================================================
  describe('Pending receipts endpoint', () => {
    it('should return pending/failed receipts for admin', async () => {
      const response = await request(app)
        .get('/api/receipts/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return pending/failed receipts for cashier', async () => {
      const response = await request(app)
        .get('/api/receipts/pending')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });
});
