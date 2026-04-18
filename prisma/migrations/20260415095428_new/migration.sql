-- No-op: this migration originally ran `ALTER TABLE "SubscriptionCatalog" ...` before the
-- table existed (see 20260415131500_subscription_catalog). That breaks `migrate dev` shadow DB (P3006).
-- The intended `DROP DEFAULT` on `price` is applied at the end of
-- 20260415140000_subscription_catalog_price_int (after `price` is added).
SELECT 1;
