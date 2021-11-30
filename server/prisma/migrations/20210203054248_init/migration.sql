-- CreateEnum
CREATE TYPE "ManagerState" AS ENUM ('IN_PROGRESS', 'VERIFYING', 'VERIFIED', 'READY');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "wabaId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manager" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER,
    "accountId" INTEGER NOT NULL,
    "partnerTokenId" INTEGER,
    "creditLineAllocationConfigId" TEXT,
    "state" "ManagerState" NOT NULL,
    "readyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerToken" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "accountId" INTEGER,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "certLastCheckedAt" TIMESTAMP(3),
    "certAvailableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account.wabaId_unique" ON "Account"("wabaId");

-- CreateIndex
CREATE INDEX "Account.userId_index" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account.wabaId_index" ON "Account"("wabaId");

-- CreateIndex
CREATE UNIQUE INDEX "Manager.accountId_unique" ON "Manager"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Manager.partnerTokenId_unique" ON "Manager"("partnerTokenId");

-- CreateIndex
CREATE INDEX "Manager.accountId_index" ON "Manager"("accountId");

-- CreateIndex
CREATE INDEX "Manager.partnerId_index" ON "Manager"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerToken.partnerId_value_unique" ON "PartnerToken"("partnerId", "value");

-- CreateIndex
CREATE INDEX "PartnerToken.partnerId_value_index" ON "PartnerToken"("partnerId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Partner.userId_unique" ON "Partner"("userId");

-- CreateIndex
CREATE INDEX "Partner.userId_index" ON "Partner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber.value_unique" ON "PhoneNumber"("value");

-- CreateIndex
CREATE INDEX "PhoneNumber.accountId_index" ON "PhoneNumber"("accountId");

-- CreateIndex
CREATE INDEX "PhoneNumber.value_index" ON "PhoneNumber"("value");

-- CreateIndex
CREATE INDEX "Session.expiresAt_index" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session.userId_index" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE INDEX "User.email_index" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Account" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD FOREIGN KEY ("partnerTokenId") REFERENCES "PartnerToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerToken" ADD FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerToken" ADD FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
