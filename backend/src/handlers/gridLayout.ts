import express from 'express';
import { layoutCrudRouter } from './gridLayoutCrud';
import { layoutFilteringRouter } from './gridLayoutFiltering';
import { layoutSharingRouter } from './gridLayoutSharing';

export const layoutRouter = express.Router();

// Mount the new modular routers
// Mount specific routes first to avoid conflicts with generic routes
layoutRouter.use(layoutSharingRouter);  // Contains /shared route
layoutRouter.use(layoutFilteringRouter); // Contains /tills/:tillId/grid-layouts
layoutRouter.use(layoutCrudRouter);      // Contains /:layoutId (most generic last)

// Health check for the API
layoutRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'Grid layout API is running', timestamp: new Date().toISOString() });
});
