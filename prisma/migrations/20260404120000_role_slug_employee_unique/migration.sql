-- Preset role slugs (owner / admin) and one employee per user per restaurant
ALTER TABLE "Role" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "Role_restaurantId_slug_key" ON "Role"("restaurantId", "slug");

CREATE UNIQUE INDEX "Employee_userId_restaurantId_key" ON "Employee"("userId", "restaurantId");
