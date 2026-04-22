ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "ticketNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "ticketDate" DATE;

-- Backfill from createdAt for existing rows
WITH ranked AS (
  SELECT
    o.id,
    (o."createdAt" AT TIME ZONE 'UTC')::date AS d,
    ROW_NUMBER() OVER (
      PARTITION BY o."restaurantId", (o."createdAt" AT TIME ZONE 'UTC')::date
      ORDER BY o."createdAt", o.id
    ) - 1 AS n
  FROM "Order" o
)
UPDATE "Order" o
SET
  "ticketDate" = ranked.d,
  "ticketNumber" = ranked.n
FROM ranked
WHERE ranked.id = o.id
  AND (o."ticketDate" IS NULL OR o."ticketNumber" IS NULL);

CREATE INDEX IF NOT EXISTS "Order_restaurantId_ticketDate_idx"
ON "Order"("restaurantId", "ticketDate");

CREATE UNIQUE INDEX IF NOT EXISTS "Order_restaurantId_ticketDate_ticketNumber_key"
ON "Order"("restaurantId", "ticketDate", "ticketNumber");
