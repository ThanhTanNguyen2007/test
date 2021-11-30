-- AlterTable
ALTER TABLE "User" ADD COLUMN     "uplineUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("uplineUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
