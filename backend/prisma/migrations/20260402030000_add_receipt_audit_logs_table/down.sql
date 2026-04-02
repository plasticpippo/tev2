-- DropForeignKey
ALTER TABLE "receipt_audit_logs" DROP CONSTRAINT IF EXISTS "receipt_audit_logs_receipt_id_fkey";

-- DropForeignKey
ALTER TABLE "receipt_audit_logs" DROP CONSTRAINT IF EXISTS "receipt_audit_logs_user_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "receipt_audit_logs_receipt_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "receipt_audit_logs_action_idx";

-- DropIndex
DROP INDEX IF EXISTS "receipt_audit_logs_user_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "receipt_audit_logs_created_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "receipt_audit_logs_receipt_id_created_at_idx";

-- DropTable
DROP TABLE IF EXISTS "receipt_audit_logs";

-- DropEnum
DROP TYPE IF EXISTS "ReceiptAuditAction";
