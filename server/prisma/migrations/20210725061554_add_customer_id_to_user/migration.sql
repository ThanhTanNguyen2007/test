/*
  Warnings:

  - The required column `customerId` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE "User" ADD COLUMN "customerId" TEXT NOT NULL DEFAULT uuid_generate_v4();
