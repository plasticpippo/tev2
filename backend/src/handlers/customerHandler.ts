import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import * as customerService from '../services/customerService';
import { logError, logDataAccess } from '../utils/logger';

import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilters,
  CustomerPagination,
} from '../types/customer';

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format").max(255).nullable().or(z.literal('')),
  phone: z.string().max(50).nullable(),
  vatNumber: z.string().max(50).nullable(),
  address: z.string().max(500).nullable(),
  city: z.string().max(100).nullable(),
  postalCode: z.string().max(20).nullable(),
  country: z.string().max(100).nullable(),
  notes: z.string().max(1000).nullable(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).optional(),
  email: z.string().email("Invalid email format").max(255).nullable().or(z.literal('')),
  phone: z.string().max(50).nullable(),
  vatNumber: z.string().max(50).nullable(),
  address: z.string().max(500).nullable(),
  city: z.string().max(100).nullable(),
  postalCode: z.string().max(20).nullable(),
  country: z.string().max(100).nullable(),
  notes: z.string().max(1000).nullable(),
});

const validateVATNumber = (vat: string | undefined): boolean => {
  if (!vat) return true;
  const itVatRegex = /^IT[0-9]{11}$/;
  const euVatRegex = /^[A-Z]{2}[0-9A-Z]{2,12}$/;
  return itVatRegex.test(vat) || euVatRegex.test(vat);
};

export const customersRouter = express.Router();

customersRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const {
      search,
      name,
      email,
      phone,
      vatNumber,
      city,
      country,
      isActive,
      includeDeleted,
      page = '1',
      limit = '20',
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const filters: CustomerFilters = {
      ...(search && { search: String(search) }),
      ...(name && { name: String(name) }),
      ...(email && { email: String(email) }),
      ...(phone && { phone: String(phone) }),
      ...(vatNumber && { vatNumber: String(vatNumber) }),
      ...(city && { city: String(city) }),
      ...(country && { country: String(country) }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(includeDeleted && { includeDeleted: includeDeleted === 'true' }),
    };

    const pagination: CustomerPagination = {
      page: parseInt(String(page), 10) || 1,
      limit: parseInt(String(limit), 10) || 20,
      sortBy: ['name', 'createdAt', 'updatedAt'].includes(String(sortBy))
        ? (String(sortBy) as 'name' | 'createdAt' | 'updatedAt')
        : 'name',
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
    };

    const result = await customerService.listCustomers(filters, pagination);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error listing customers', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('customers.fetchFailed') });
  }
});

customersRouter.get('/search', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: t('customers.searchQueryRequired') });
    }

    const limitNum = parseInt(String(limit), 10) || 10;
    const customers = await customerService.searchCustomers(q, limitNum);
    res.json(customers);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error searching customers', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('customers.searchFailed') });
  }
});

customersRouter.get('/check-duplicate', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { name, email } = req.query;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: t('customers.nameRequired') });
    }

    const result = await customerService.checkDuplicateCustomer(
      name,
      email ? String(email) : null
    );
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error checking duplicate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('customers.duplicateCheckFailed') });
  }
});

customersRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(Number(id));

    if (!customer) {
      return res.status(404).json({ error: t('customers.notFound') });
    }

    res.json(customer);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching customer', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('customers.fetchOneFailed') });
  }
});

customersRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: t('auth.userNotFound') });
    }

    const validation = createCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: t('customers.validationFailed'),
        details: validation.error.errors,
      });
    }

    const { name, email, phone, vatNumber, address, city, postalCode, country, notes } = validation.data;

    if (vatNumber && !validateVATNumber(vatNumber)) {
      return res.status(400).json({
        error: t('customers.invalidVatNumber'),
      });
    }

    if (email) {
      const isUnique = await customerService.checkEmailUniqueness(email);
      if (!isUnique) {
        return res.status(409).json({ error: t('customers.duplicateEmail') });
      }
    }

    const input: CreateCustomerInput = {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      vatNumber: vatNumber?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      postalCode: postalCode?.trim() || null,
      country: country?.trim() || null,
      notes: notes?.trim() || null,
    };

    const customer = await customerService.createCustomer(input, userId);

    logDataAccess('customer', customer.id, 'CREATE', userId, req.user?.username);

    res.status(201).json(customer);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating customer', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('customers.createFailed') });
  }
});

customersRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: t('auth.userNotFound') });
    }

    const validation = updateCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: t('customers.validationFailed'),
        details: validation.error.errors,
      });
    }

    const { name, email, phone, vatNumber, address, city, postalCode, country, notes } = validation.data;
    const { isActive } = req.body;

    if (vatNumber && !validateVATNumber(vatNumber)) {
      return res.status(400).json({
        error: t('customers.invalidVatNumber'),
      });
    }

    if (email !== undefined && email !== null) {
      const isUnique = await customerService.checkEmailUniqueness(email, Number(id));
      if (!isUnique) {
        return res.status(409).json({ error: t('customers.duplicateEmail') });
      }
    }

    const input: UpdateCustomerInput = {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(vatNumber !== undefined && { vatNumber: vatNumber?.trim() || null }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(postalCode !== undefined && { postalCode: postalCode?.trim() || null }),
      ...(country !== undefined && { country: country?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(isActive !== undefined && { isActive }),
    };

    const customer = await customerService.updateCustomer(Number(id), input);

    if (!customer) {
      return res.status(404).json({ error: t('customers.notFound') });
    }

    logDataAccess('customer', customer.id, 'UPDATE', userId, req.user?.username);

    res.json(customer);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating customer', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('customers.updateFailed') });
  }
});

customersRouter.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: t('auth.userNotFound') });
    }

    const customer = await customerService.softDeleteCustomer(Number(id));

    if (!customer) {
      return res.status(404).json({ error: t('customers.notFound') });
    }

    logDataAccess('customer', customer.id, 'DELETE', userId, req.user?.username);

    res.json(customer);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting customer', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('customers.deleteFailed') });
  }
});

export default customersRouter;
