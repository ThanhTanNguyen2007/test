-- CreateEnum
CREATE TYPE "CreditLineState" AS ENUM ('SHARED', 'MANUALLY_REVOKED', 'AUTO_REVOKED', 'NONE');

-- AlterTable
ALTER TABLE "Manager" ADD COLUMN     "creditLineState" "CreditLineState" NOT NULL DEFAULT E'NONE';

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "isActivated" BOOLEAN NOT NULL DEFAULT true;
