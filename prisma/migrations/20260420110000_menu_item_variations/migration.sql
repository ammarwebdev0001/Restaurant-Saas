-- Add per-product variations/swatches for storefront selection.
CREATE TABLE "MenuItemVariation" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageKey" TEXT,
    "swatchHex" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "priceDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemVariation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MenuItemVariation_menuItemId_sortOrder_idx"
ON "MenuItemVariation"("menuItemId", "sortOrder");

ALTER TABLE "MenuItemVariation"
ADD CONSTRAINT "MenuItemVariation_menuItemId_fkey"
FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
