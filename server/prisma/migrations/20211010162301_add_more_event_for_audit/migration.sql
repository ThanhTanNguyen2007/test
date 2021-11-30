-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'USER_CANCEL_FACEBOOK_FLOW';
ALTER TYPE "AuditAction" ADD VALUE 'WABA_CONNECT_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'PHONE_MIGRATION_INIT';
ALTER TYPE "AuditAction" ADD VALUE 'PHONE_MIGRATION_INIT_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'PHONE_MIGRATION_REQUEST_OTP';
ALTER TYPE "AuditAction" ADD VALUE 'PHONE_MIGRATION_REQUEST_OTP_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'PHONE_MIGRATION_VERIFY_OTP';
ALTER TYPE "AuditAction" ADD VALUE 'PHONE_MIGRATION_VERIFY_OTP_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'PRONE_MIGRATION_VERIFIED_OTP';
