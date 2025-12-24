-- Create special categories for "All Products" and "Favorites"
INSERT INTO "categories" ("id", "name", "visibleTillIds") 
VALUES 
  (-1, 'Favorites', NULL),
  (0, 'All Products', NULL)
ON CONFLICT ("id") DO NOTHING;