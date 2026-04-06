-- Platform-wide roles require NULL restaurantId (idempotent if already nullable)
ALTER TABLE "Role" ALTER COLUMN "restaurantId" DROP NOT NULL;
