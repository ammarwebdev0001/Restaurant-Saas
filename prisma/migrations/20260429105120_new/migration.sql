/*
  Warnings:

  - A unique constraint covering the columns `[shortOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shortOrderId" VARCHAR(6) NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));

-- CreateIndex
CREATE UNIQUE INDEX "Order_shortOrderId_key" ON "Order"("shortOrderId");
