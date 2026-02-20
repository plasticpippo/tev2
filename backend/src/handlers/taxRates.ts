import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';
import { AppError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logError, logInfo } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import i18n from '../i18n';

export const taxRatesRouter = Router();

/**
 * Helper function to format tax rate for API response
 * Converts Decimal rate to string and adds computed ratePercent field
 */
function formatTaxRate(taxRate: any) {
  return {
    id: taxRate.id,
    name: taxRate.name,
    rate: taxRate.rate.toString(),
    ratePercent: `${(Number(taxRate.rate) * 100).toFixed(2)}%`,
    description: taxRate.description,
    isDefault: taxRate.isDefault,
    isActive: taxRate.isActive,
    createdAt: taxRate.createdAt.toISOString(),
    updatedAt: taxRate.updatedAt.toISOString(),
  };
}

/**
 * Validation helper for tax rate data
 * @param data - The data to validate
 * @param isUpdate - Whether this is an update operation (fields are optional)
 * @returns Array of error messages (empty if valid)
 */
function validateTaxRateData(data: any, isUpdate: boolean = false): string[] {
  const errors: string[] = [];

  // Name validation
  if (!isUpdate || data.name !== undefined) {
    if (!isUpdate && !data.name) {
      errors.push(i18n.t('errors:taxRates.nameRequired'));
    } else if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push(i18n.t('errors:taxRates.nameInvalid'));
      } else if (data.name.length > 100) {
        errors.push(i18n.t('errors:taxRates.nameTooLong'));
      }
    }
  }

  // Rate validation
  if (!isUpdate || data.rate !== undefined) {
    if (!isUpdate && data.rate === undefined) {
      errors.push(i18n.t('errors:taxRates.rateRequired'));
    } else if (data.rate !== undefined) {
      const rate = typeof data.rate === 'string' ? parseFloat(data.rate) : data.rate;
      if (isNaN(rate)) {
        errors.push(i18n.t('errors:taxRates.rateInvalid'));
      } else if (rate < 0 || rate > 1) {
        errors.push(i18n.t('errors:taxRates.rateOutOfRange'));
      }
    }
  }

  return errors;
}

/**
 * GET /api/tax-rates
 * List all tax rates
 * - Returns all active tax rates ordered by rate ascending
 * - Includes computed ratePercent field
 */
export const listTaxRates = async (req: Request, res: Response) => {
  try {
    const taxRates = await prisma.taxRate.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { rate: 'asc' },
      ],
    });

    res.json(taxRates.map(formatTaxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching tax rates', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.fetchFailed') });
  }
};

/**
 * GET /api/tax-rates/:id
 * Get a single tax rate by ID
 * - Returns 404 if not found
 * - Includes computed ratePercent field
 */
export const getTaxRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: Number(id) },
    });

    if (!taxRate) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }

    res.json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.fetchOneFailed') });
  }
};

/**
 * POST /api/tax-rates
 * Create a new tax rate
 * - Admin only
 * - Validates name (required, max 100 chars, unique case-insensitive)
 * - Validates rate (required, between 0 and 1)
 * - If isDefault is true, unsets any existing default first
 */
export const createTaxRate = async (req: Request, res: Response) => {
  try {
    const { name, rate, description, isDefault } = req.body;

    // Validate input
    const errors = validateTaxRateData(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({
        error: i18n.t('errors:taxRates.validationFailed'),
        details: errors,
      });
    }

    // Check for duplicate name (case-insensitive)
    const existing = await prisma.taxRate.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });

    if (existing) {
      return res.status(400).json({ error: i18n.t('errors:taxRates.nameExists') });
    }

    // Parse rate to number
    const rateNumber = typeof rate === 'string' ? parseFloat(rate) : rate;

    // Create tax rate (handle default in transaction)
    const taxRate = await prisma.$transaction(async (tx) => {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await tx.taxRate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxRate.create({
        data: {
          name: name.trim(),
          rate: rateNumber,
          description: description?.trim() || null,
          isDefault: isDefault ?? false,
          isActive: true,
        },
      });
    });

    logInfo('Tax rate created', { taxRateId: taxRate.id, name: taxRate.name });
    res.status(201).json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.createFailed') });
  }
};

/**
 * PUT /api/tax-rates/:id
 * Update an existing tax rate
 * - Admin only
 * - Validates fields if provided
 * - Checks for duplicate name if name is being changed
 * - If setting isDefault to true, unsets any existing default first
 */
export const updateTaxRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, rate, description, isDefault, isActive } = req.body;

    // Validate input (all fields optional for update)
    const errors = validateTaxRateData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        error: i18n.t('errors:taxRates.validationFailed'),
        details: errors,
      });
    }

    // Check if tax rate exists
    const existing = await prisma.taxRate.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }

    // Check for duplicate name (if name is being changed)
    if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.taxRate.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: Number(id) },
        },
      });

      if (duplicate) {
        return res.status(400).json({ error: i18n.t('errors:taxRates.nameExists') });
      }
    }

    // Update tax rate (handle default in transaction)
    const taxRate = await prisma.$transaction(async (tx) => {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await tx.taxRate.updateMany({
          where: { isDefault: true, id: { not: Number(id) } },
          data: { isDefault: false },
        });
      }

      return tx.taxRate.update({
        where: { id: Number(id) },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          rate: rate !== undefined ? (typeof rate === 'string' ? parseFloat(rate) : rate) : undefined,
          description: description === null ? null : (description !== undefined ? description.trim() : undefined),
          isDefault: isDefault !== undefined ? isDefault : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
      });
    });

    logInfo('Tax rate updated', { taxRateId: taxRate.id, name: taxRate.name });
    res.json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.updateFailed') });
  }
};

/**
 * DELETE /api/tax-rates/:id
 * Soft delete a tax rate (set isActive to false)
 * - Admin only
 * - Cannot delete the default tax rate
 */
export const deleteTaxRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tax rate exists
    const existing = await prisma.taxRate.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }

    // Check if this is the default tax rate
    if (existing.isDefault) {
      return res.status(400).json({ error: i18n.t('errors:taxRates.cannotDeleteDefault') });
    }

    // Soft delete (set isActive to false)
    const taxRate = await prisma.taxRate.update({
      where: { id: Number(id) },
      data: { isActive: false, isDefault: false },
    });

    logInfo('Tax rate deactivated', { taxRateId: taxRate.id, name: taxRate.name });
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deactivating tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.deleteFailed') });
  }
};

/**
 * PUT /api/tax-rates/:id/default
 * Set a tax rate as the default
 * - Admin only
 * - Tax rate must exist and be active
 * - Uses transaction to ensure atomicity
 */
export const setDefaultTaxRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tax rate exists and is active
    const existing = await prisma.taxRate.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: i18n.t('errors:taxRates.notFound') });
    }

    if (!existing.isActive) {
      return res.status(400).json({ error: i18n.t('errors:taxRates.cannotSetInactiveAsDefault') });
    }

    // Set as default in transaction
    const taxRate = await prisma.$transaction(async (tx) => {
      // Unset all defaults
      await tx.taxRate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // Set new default
      return tx.taxRate.update({
        where: { id: Number(id) },
        data: { isDefault: true },
      });
    });

    // Update settings to point to new default
    await prisma.settings.updateMany({
      data: { defaultTaxRateId: taxRate.id },
    });

    logInfo('Tax rate set as default', { taxRateId: taxRate.id, name: taxRate.name });
    res.json(formatTaxRate(taxRate));
  } catch (error) {
    logError(error instanceof Error ? error : 'Error setting default tax rate', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:taxRates.setDefaultFailed') });
  }
};

// Route definitions
// GET /api/tax-rates - List all tax rates (authenticated)
taxRatesRouter.get('/', authenticateToken, listTaxRates);

// GET /api/tax-rates/:id - Get single tax rate (authenticated)
taxRatesRouter.get('/:id', authenticateToken, getTaxRate);

// POST /api/tax-rates - Create tax rate (admin only)
taxRatesRouter.post('/', authenticateToken, requireAdmin, createTaxRate);

// PUT /api/tax-rates/:id - Update tax rate (admin only)
taxRatesRouter.put('/:id', authenticateToken, requireAdmin, updateTaxRate);

// DELETE /api/tax-rates/:id - Delete tax rate (soft delete, admin only)
taxRatesRouter.delete('/:id', authenticateToken, requireAdmin, deleteTaxRate);

// PUT /api/tax-rates/:id/default - Set as default (admin only)
taxRatesRouter.put('/:id/default', authenticateToken, requireAdmin, setDefaultTaxRate);

export default {
  listTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  setDefaultTaxRate,
};
