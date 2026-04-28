-- AlterEnum: Add 'issuing' status to ReceiptStatus
ALTER TYPE "ReceiptStatus" ADD VALUE 'issuing' BEFORE 'issued';
