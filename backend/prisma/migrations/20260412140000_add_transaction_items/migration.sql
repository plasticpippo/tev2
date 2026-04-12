-- CreateTable
CREATE TABLE "transaction_items" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "effectiveTaxRate" DECIMAL(10,4),
    "unitCost" DECIMAL(10,4),
    "totalCost" DECIMAL(10,4),

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_items_transactionId_idx" ON "transaction_items"("transactionId");
CREATE INDEX "transaction_items_variantId_idx" ON "transaction_items"("variantId");
CREATE INDEX "transaction_items_productId_idx" ON "transaction_items"("productId");

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing transactions from JSON items
-- The items column stores a JSON string containing a stringified JSON array (double-encoded).
-- We use (t.items #>> '{}')::jsonb to unwrap the outer string, then jsonb_array_elements to expand.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "transactions" LIMIT 1) THEN
    INSERT INTO "transaction_items" ("transactionId", "productId", "variantId", "productName", "variantName", "price", "quantity", "effectiveTaxRate")
    SELECT
      t.id,
      (item->>'productId')::int,
      (item->>'variantId')::int,
      COALESCE(item->>'name', ''),
      COALESCE(item->>'name', ''),
      COALESCE((item->>'price')::decimal, 0),
      COALESCE((item->>'quantity')::int, 0),
      CASE WHEN item->>'effectiveTaxRate' IS NOT NULL
           THEN (item->>'effectiveTaxRate')::decimal
           ELSE NULL
      END
    FROM "transactions" t, jsonb_array_elements((t.items #>> '{}')::jsonb) AS item
    WHERE t.items IS NOT NULL;
  END IF;
END $$;
