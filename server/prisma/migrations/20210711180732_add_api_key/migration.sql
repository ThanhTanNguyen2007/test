-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey.value_unique" ON "ApiKey"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey.partnerId_unique" ON "ApiKey"("partnerId");

-- CreateIndex
CREATE INDEX "ApiKey.partnerId_index" ON "ApiKey"("partnerId");

-- CreateIndex
CREATE INDEX "ApiKey.value_index" ON "ApiKey"("value");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
