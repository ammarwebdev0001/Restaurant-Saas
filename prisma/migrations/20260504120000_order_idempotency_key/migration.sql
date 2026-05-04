-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "idempotencyKey" VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
