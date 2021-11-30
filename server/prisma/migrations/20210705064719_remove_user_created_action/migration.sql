/*
  Warnings:

  - The values [USER_ADDED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('USER_LOGGED_IN', 'USER_LOGGED_OUT', 'WABA_CONNECTION_REQUEST', 'WABA_CONNECTED', 'PARTNER_TOKEN_GENERATED', 'PARTNER_TOKEN_DELETED', 'PARTNER_TOKEN_USED', 'PARTNER_PROMOTED', 'PARTNER_ACTIVATED', 'PARTNER_DEACTIVATED', 'CREDIT_LINE_REVOKED', 'CREDIT_LINE_SHARED');
ALTER TABLE "Audit" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;
