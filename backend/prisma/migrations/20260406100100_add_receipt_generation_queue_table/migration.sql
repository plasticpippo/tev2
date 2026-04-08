-- CreateTable: Receipt generation queue for PDF processing
CREATE TABLE "receipt_generation_queue" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_generation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipt_generation_queue_receipt_id_key" ON "receipt_generation_queue"("receipt_id");

-- CreateIndex for queue processing
CREATE INDEX "receipt_generation_queue_status_next_attempt_at_idx" ON "receipt_generation_queue"("status", "next_attempt_at");

-- AddForeignKey
ALTER TABLE "receipt_generation_queue" ADD CONSTRAINT "receipt_generation_queue_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
