-- CreateEnum
CREATE TYPE "EmailJobStatus" AS ENUM ('pending', 'processing', 'sent', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "email_queue" (
    "id" TEXT NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "attachment_path" TEXT,
    "attachment_filename" TEXT,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_queue_status_priority_idx" ON "email_queue"("status", "priority");

-- CreateIndex
CREATE INDEX "email_queue_next_attempt_at_idx" ON "email_queue"("next_attempt_at");

-- CreateIndex
CREATE INDEX "email_queue_receipt_id_idx" ON "email_queue"("receipt_id");

-- CreateIndex
CREATE INDEX "email_queue_created_at_idx" ON "email_queue"("created_at");

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
