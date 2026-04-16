-- AlterTable
ALTER TABLE "SubscriptionCatalog"
ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0;

-- Seed numeric prices for existing plans
UPDATE "SubscriptionCatalog" SET "price" = 29 WHERE "plan" = 'STARTER';
UPDATE "SubscriptionCatalog" SET "price" = 79 WHERE "plan" = 'GROWTH';
UPDATE "SubscriptionCatalog" SET "price" = 0 WHERE "plan" = 'SCALE';
