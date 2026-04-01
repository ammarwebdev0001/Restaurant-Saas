-- CreateEnum
CREATE TYPE "AttributeSelectionType" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "description" TEXT,
ADD COLUMN "salePrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "MenuItemAttributeGroup" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "selectionType" "AttributeSelectionType" NOT NULL DEFAULT 'SINGLE',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "linkedCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemAttributeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemModifier" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItemModifier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MenuItemAttributeGroup_menuItemId_idx" ON "MenuItemAttributeGroup"("menuItemId");
CREATE INDEX "MenuItemAttributeGroup_linkedCategoryId_idx" ON "MenuItemAttributeGroup"("linkedCategoryId");
CREATE INDEX "OrderItemModifier_orderItemId_idx" ON "OrderItemModifier"("orderItemId");

ALTER TABLE "MenuItemAttributeGroup" ADD CONSTRAINT "MenuItemAttributeGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItemAttributeGroup" ADD CONSTRAINT "MenuItemAttributeGroup_linkedCategoryId_fkey" FOREIGN KEY ("linkedCategoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
