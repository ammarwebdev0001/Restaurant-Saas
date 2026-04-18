-- Remove DB default on price (matches Prisma model). Safe after 20260415140000 adds the column.
-- Original ALTER lived in 20260415095428_new before SubscriptionCatalog existed (shadow DB P3006).
ALTER TABLE "SubscriptionCatalog" ALTER COLUMN "price" DROP DEFAULT;
