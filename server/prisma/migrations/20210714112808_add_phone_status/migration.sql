-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "PhoneNumber" ADD COLUMN     "nameStatus" TEXT,
ADD COLUMN     "qualityRating" TEXT,
ADD COLUMN     "verifiedName" TEXT,
ADD COLUMN     "status" TEXT;
