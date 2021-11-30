/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `WABAMigration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WABAMigration" DROP COLUMN "phoneNumber",
ADD COLUMN     "phoneNumbers" TEXT[];
