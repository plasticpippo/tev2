import request from 'supertest';
import express from 'express';
import { layoutRouter } from '../handlers/gridLayout';
import { prisma } from '../prisma';

// Create an express app to test the router
const app = express();
app.use(express.json());
app.use('/api/grid-layouts', layoutRouter);

// Mock data with the correct structure based on Prisma schema
const mockLayout: any = {
  id: 1,
  name: 'Test Layout',
  tillId: 1,
  layout: {
    columns: 4,
    gridItems: [],
    version: '1.0'
  },
  isDefault: true,
 createdAt: new Date('2023-01-01T00:00Z'),
   updatedAt: new Date('2023-01-01T00:00:00Z'),
  categoryId: null,
  filterType: 'all'
};

const mockLayouts: any[] = [
  {
    id: 1,
    name: 'Test Layout 1',
    tillId: 1,
    layout: {
      columns: 4,
      gridItems: [],
      version: '1.0'
    },
    isDefault: true,
    createdAt: new Date('2023-01-01T00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    categoryId: null,
    filterType: 'all'
  },
  {
    id: 2,
    name: 'Test Layout 2',
    tillId: 1,
    layout: {
      columns: 4,
      gridItems: [],
      version: '1.0'
    },
    isDefault: false,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    categoryId: null,
    filterType: 'favorites'
  }
];

describe('Grid Layout API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/grid-layouts/tills/:tillId/grid-layouts', () => {
    it('should return all layouts for a till', async () => {
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue(mockLayouts);

      const response = await request(app)
        .get('/api/grid-layouts/tills/1/grid-layouts')
        .expect(200);

      expect(response.body).toEqual(mockLayouts);
      expect(prisma.productGridLayout.findMany).toHaveBeenCalledWith({
        where: { tillId: 1 },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should return layouts filtered by filterType', async () => {
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([mockLayouts[0]]);

      const response = await request(app)
        .get('/api/grid-layouts/tills/1/grid-layouts?filterType=all')
        .expect(200);

      expect(response.body).toEqual([mockLayouts[0]]);
      expect(prisma.productGridLayout.findMany).toHaveBeenCalledWith({
        where: { tillId: 1, filterType: 'all' },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should return 400 for invalid till ID', async () => {
      const response = await request(app)
        .get('/api/grid-layouts/tills/invalid/grid-layouts')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid till ID' });
    });
  });

 describe('POST /api/grid-layouts/tills/:tillId/grid-layouts', () => {
    const newLayoutData = {
      name: 'New Layout',
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'all',
      categoryId: null
    };

    it('should create a new layout', async () => {
      (prisma.productGridLayout.create as jest.Mock).mockResolvedValue(mockLayout);
      (prisma.productGridLayout.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const response = await request(app)
        .post('/api/grid-layouts/tills/1/grid-layouts')
        .send(newLayoutData)
        .expect(201);

      expect(response.body).toEqual(mockLayout);
      expect(prisma.productGridLayout.create).toHaveBeenCalledWith({
        data: {
          tillId: 1,
          name: 'New Layout',
          layout: {
            columns: 4,
            gridItems: [],
            version: '1.0'
          },
          isDefault: false,
          filterType: 'all',
          categoryId: null
        }
      });
    });

    it('should unset other defaults when creating a default layout', async () => {
      const defaultLayoutData = {
        ...newLayoutData,
        isDefault: true
      };

      (prisma.productGridLayout.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.productGridLayout.create as jest.Mock).mockResolvedValue(mockLayout);

      const response = await request(app)
        .post('/api/grid-layouts/tills/1/grid-layouts')
        .send(defaultLayoutData)
        .expect(201);

      expect(response.body).toEqual(mockLayout);
      expect(prisma.productGridLayout.updateMany).toHaveBeenCalledWith({
        where: { tillId: 1, isDefault: true, filterType: 'all' },
        data: { isDefault: false }
      });
    });

    it('should return 400 for invalid till ID', async () => {
      const response = await request(app)
        .post('/api/grid-layouts/tills/invalid/grid-layouts')
        .send(newLayoutData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid till ID' });
    });
  });

 describe('GET /api/grid-layouts/:layoutId', () => {
    it('should return a specific layout', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(mockLayout);

      const response = await request(app)
        .get('/api/grid-layouts/1')
        .expect(200);

      expect(response.body).toEqual(mockLayout);
      expect(prisma.productGridLayout.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if layout not found', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/grid-layouts/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Layout not found' });
    });

    it('should return 400 for invalid layout ID', async () => {
      const response = await request(app)
        .get('/api/grid-layouts/invalid')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid layout ID' });
    });
  });

  describe('PUT /api/grid-layouts/:layoutId', () => {
    const updateData = {
      name: 'Updated Layout',
      layout: {
        columns: 6,
        gridItems: [],
        version: '1.0'
      },
      isDefault: true,
      filterType: 'favorites',
      categoryId: 1
    };

    it('should update an existing layout', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(mockLayout);
      (prisma.productGridLayout.update as jest.Mock).mockResolvedValue({
        ...mockLayout,
        ...updateData
      });
      (prisma.productGridLayout.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const response = await request(app)
        .put('/api/grid-layouts/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        ...mockLayout,
        ...updateData
      });
      expect(prisma.productGridLayout.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Layout',
          layout: {
            columns: 6,
            gridItems: [],
            version: '1.0'
          },
          isDefault: true,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should return 404 if layout not found', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/grid-layouts/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({ error: 'Layout not found' });
    });

    it('should return 400 for invalid layout ID', async () => {
      const response = await request(app)
        .put('/api/grid-layouts/invalid')
        .send(updateData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid layout ID' });
    });
  });

  describe('DELETE /api/grid-layouts/:layoutId', () => {
    it('should delete an existing layout', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(mockLayout);
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([mockLayouts[1]]); // Other layouts exist
      (prisma.productGridLayout.delete as jest.Mock).mockResolvedValue(mockLayout);

      const response = await request(app)
        .delete('/api/grid-layouts/1')
        .expect(204);

      expect(prisma.productGridLayout.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if layout not found', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/grid-layouts/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Layout not found' });
    });

    it('should return 400 if trying to delete the only layout for a till', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(mockLayout);
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([]); // No other layouts exist

      const response = await request(app)
        .delete('/api/grid-layouts/1')
        .expect(40);

      expect(response.body).toEqual({ error: 'Cannot delete the only layout for a till' });
    });

    it('should return 400 for invalid layout ID', async () => {
      const response = await request(app)
        .delete('/api/grid-layouts/invalid')
        .expect(40);

      expect(response.body).toEqual({ error: 'Invalid layout ID' });
    });
  });

  describe('PUT /api/grid-layouts/:layoutId/set-default', () => {
    it('should set a layout as default', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(mockLayout);
      (prisma.productGridLayout.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.productGridLayout.update as jest.Mock).mockResolvedValue({
        ...mockLayout,
        isDefault: true
      });

      const response = await request(app)
        .put('/api/grid-layouts/1/set-default')
        .expect(200);

      expect(response.body).toEqual({
        ...mockLayout,
        isDefault: true
      });
      expect(prisma.productGridLayout.updateMany).toHaveBeenCalledWith({
        where: { tillId: 1, isDefault: true, filterType: 'all' },
        data: { isDefault: false }
      });
      expect(prisma.productGridLayout.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDefault: true }
      });
    });

    it('should return 404 if layout not found', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/grid-layouts/999/set-default')
        .expect(404);

      expect(response.body).toEqual({ error: 'Layout not found' });
    });

    it('should return 400 for invalid layout ID', async () => {
      const response = await request(app)
        .put('/api/grid-layouts/invalid/set-default')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid layout ID' });
    });
  });

  describe('GET /api/grid-layouts/tills/:tillId/current-layout', () => {
    it('should return the default layout for a till', async () => {
      const defaultLayout = { ...mockLayout, isDefault: true };
      (prisma.productGridLayout.findFirst as jest.Mock).mockResolvedValue(defaultLayout);

      const response = await request(app)
        .get('/api/grid-layouts/tills/1/current-layout')
        .expect(200);

      expect(response.body).toEqual(defaultLayout);
      expect(prisma.productGridLayout.findFirst).toHaveBeenCalledWith({
        where: {
          tillId: 1,
          isDefault: true,
          filterType: 'all'
        }
      });
    });

    it('should return the first layout if no default exists', async () => {
      (prisma.productGridLayout.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // No default layout
        .mockResolvedValueOnce(mockLayouts[0]); // First layout

      const response = await request(app)
        .get('/api/grid-layouts/tills/1/current-layout')
        .expect(200);

      expect(response.body).toEqual(mockLayouts[0]);
    });

    it('should return a fallback layout if no layouts exist for filter type', async () => {
      (prisma.productGridLayout.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // No default layout
        .mockResolvedValueOnce(null); // No first layout

      const response = await request(app)
        .get('/api/grid-layouts/tills/1/current-layout')
        .expect(200);

      expect(response.body).toEqual({
        id: null,
        tillId: 1,
        name: 'Default all Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: true,
        filterType: 'all',
        categoryId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should return 400 for invalid till ID', async () => {
      const response = await request(app)
        .get('/api/grid-layouts/tills/invalid/current-layout')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid till ID' });
    });
  });

 describe('GET /api/grid-layouts/tills/:tillId/layouts-by-filter/:filterType', () => {
    it('should return layouts for a specific filter type', async () => {
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([mockLayouts[0]]);

      const response = await request(app)
        .get('/api/grid-layouts/tills/1/layouts-by-filter/all')
        .expect(200);

      expect(response.body).toEqual([mockLayouts[0]]);
      expect(prisma.productGridLayout.findMany).toHaveBeenCalledWith({
        where: { tillId: 1, filterType: 'all' },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should return layouts for category filter with categoryId', async () => {
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([mockLayouts[0]]);

      const response = await request(app)
        .get('/api/grid-layouts/tills/1/layouts-by-filter/category?categoryId=2')
        .expect(200);

      expect(response.body).toEqual([mockLayouts[0]]);
      expect(prisma.productGridLayout.findMany).toHaveBeenCalledWith({
        where: { tillId: 1, filterType: 'category', categoryId: 2 },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should return 400 for invalid filter type', async () => {
      const response = await request(app)
        .get('/api/grid-layouts/tills/1/layouts-by-filter/invalid')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid filter type. Valid types: all, favorites, category' });
    });

    it('should return 400 for invalid till ID', async () => {
      const response = await request(app)
        .get('/api/grid-layouts/tills/invalid/layouts-by-filter/all')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid till ID' });
    });
  });
});