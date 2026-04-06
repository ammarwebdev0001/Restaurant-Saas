-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_restaurantId_fkey";

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
