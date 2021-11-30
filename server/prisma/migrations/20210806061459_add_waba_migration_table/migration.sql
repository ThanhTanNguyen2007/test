-- AlterTable
ALTER TABLE "User" ALTER COLUMN "customerId" DROP DEFAULT;

-- CreateTable
CREATE TABLE "WABAMigration" (
    "id" SERIAL NOT NULL,
    "partnerEmail" TEXT NOT NULL,
    "existingWABAId" TEXT NOT NULL,
    "existingWABAName" TEXT NOT NULL,
    "newWABAId" TEXT NOT NULL,
    "newWABAName" TEXT NOT NULL,
    "businessManagerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "businessVerificationStatus" TEXT,
    "WABAReviewStatus" TEXT,
    "twoFADisabled" BOOLEAN NOT NULL DEFAULT false,
    "krWABACreated" BOOLEAN NOT NULL DEFAULT false,
    "clientConfirm" BOOLEAN NOT NULL DEFAULT false,
    "readyForMigration" BOOLEAN NOT NULL DEFAULT false,
    "migrationInitiated" BOOLEAN NOT NULL DEFAULT false,
    "migrationConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WABAMigration.existingWABAId_unique" ON "WABAMigration"("existingWABAId");

-- CreateIndex
CREATE UNIQUE INDEX "WABAMigration.newWABAId_unique" ON "WABAMigration"("newWABAId");
