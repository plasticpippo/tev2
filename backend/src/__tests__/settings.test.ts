import request from 'supertest';
import express from 'express';
import { settingsRouter } from '../handlers/settings';
import { prisma } from '../prisma';

// Create an Express app to mount the settings routes for testing
const app = express();
app.use(express.json());
app.use('/api/settings', settingsRouter);

describe('Settings API', () => {
 beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should return current settings', async () => {
      const mockSettings = {
        id: 1,
        taxMode: 'inclusive',
        autoStartTime: '06:00',
        lastManualClose: null
      };
      
      const expectedSettings = {
        tax: { mode: 'inclusive' },
        businessDay: {
          autoStartTime: '06:00',
          lastManualClose: null
        }
      };

      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body).toEqual(expectedSettings);
      expect(prisma.settings.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return default settings if no settings exist', async () => {
      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body).toEqual({
        tax: { mode: 'none' },
        businessDay: {
          autoStartTime: '06:00',
          lastManualClose: null
        }
      });
    });

    it('should handle errors when fetching settings fails', async () => {
      (prisma.settings.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/settings')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch settings' });
    });
  });

  describe('PUT /api/settings', () => {
    it('should update existing settings', async () => {
      const settingsToUpdate = {
        tax: { mode: 'inclusive' },
        businessDay: {
          autoStartTime: '06:00',
          lastManualClose: null
        }
      };
      
      const updatedSettings = {
        id: 1,
        taxMode: 'inclusive',
        autoStartTime: '06:00',
        lastManualClose: null
      };

      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(updatedSettings);
      (prisma.settings.update as jest.Mock).mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/settings')
        .send(settingsToUpdate)
        .expect(200);

      expect(response.body).toEqual(settingsToUpdate);
      expect(prisma.settings.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          taxMode: 'inclusive',
          autoStartTime: '06:00',
          lastManualClose: null
        }
      });
    });

    it('should create settings if none exist', async () => {
      const settingsToCreate = {
        tax: { mode: 'exclusive' },
        businessDay: {
          autoStartTime: '07:00',
          lastManualClose: null
        }
      };
      
      const createdSettings = {
        id: 1,
        taxMode: 'exclusive',
        autoStartTime: '07:00',
        lastManualClose: null
      };

      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.settings.create as jest.Mock).mockResolvedValue(createdSettings);

      const response = await request(app)
        .put('/api/settings')
        .send(settingsToCreate)
        .expect(200);

      expect(response.body).toEqual(settingsToCreate);
      expect(prisma.settings.create).toHaveBeenCalledWith({
        data: {
          taxMode: 'exclusive',
          autoStartTime: '07:00',
          lastManualClose: null
        }
      });
    });
  });
});