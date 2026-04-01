-- CreateTable
CREATE TABLE "MenuItemOffer" (
    "id" TEXT NOT NULL,
    "baseItemId" TEXT NOT NULL,
    "offeredItemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuItemOffer_baseItemId_idx" ON "MenuItemOffer"("baseItemId");

-- AddForeignKey
ALTER TABLE "MenuItemOffer" ADD CONSTRAINT "MenuItemOffer_baseItemId_fkey" FOREIGN KEY ("baseItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemOffer" ADD CONSTRAINT "MenuItemOffer_offeredItemId_fkey" FOREIGN KEY ("offeredItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
