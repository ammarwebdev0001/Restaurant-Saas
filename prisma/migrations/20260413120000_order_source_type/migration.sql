-- CreateEnum
CREATE TYPE "OrderSourceType" AS ENUM ('POS', 'ONLINE', 'WALK_IN', 'OTHER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "sourceType" "OrderSourceType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "restaurantId" TEXT,
ADD COLUMN "sourceType" "OrderSourceType" NOT NULL DEFAULT 'WALK_IN';

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Order_restaurantId_idx" ON "Order"("restaurantId");

-- CreateIndex
CREATE INDEX "Order_sourceType_idx" ON "Order"("sourceType");

-- CreateIndex
CREATE INDEX "Transaction_restaurantId_idx" ON "Transaction"("restaurantId");

-- CreateIndex
CREATE INDEX "Transaction_sourceType_idx" ON "Transaction"("sourceType");
