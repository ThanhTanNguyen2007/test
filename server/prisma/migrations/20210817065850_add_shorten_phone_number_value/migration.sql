/*
  Warnings:

  - A unique constraint covering the columns `[shortenValue]` on the table `PhoneNumber` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PhoneNumber" ADD COLUMN     "shortenValue" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber.shortenValue_unique" ON "PhoneNumber"("shortenValue");

-- CreateIndex
CREATE INDEX "PhoneNumber.shortenValue_index" ON "PhoneNumber"("shortenValue");
