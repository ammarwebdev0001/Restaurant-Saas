-- Platform-wide roles: Role.restaurantId nullable; User.roleId -> Role; drop legacy User.role enum

ALTER TABLE "Role" ALTER COLUMN "restaurantId" DROP NOT NULL;

INSERT INTO "Role" ("id", "name", "slug", "restaurantId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Platform Admin', 'platform_admin', NULL, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Role" r WHERE r."slug" = 'platform_admin' AND r."restaurantId" IS NULL
);

INSERT INTO "Role" ("id", "name", "slug", "restaurantId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Pending Owner', 'pending_owner', NULL, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Role" r WHERE r."slug" = 'pending_owner' AND r."restaurantId" IS NULL
);

INSERT INTO "Role" ("id", "name", "slug", "restaurantId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Pending Worker', 'pending_worker', NULL, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Role" r WHERE r."slug" = 'pending_worker' AND r."restaurantId" IS NULL
);

ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'role'
  ) THEN
    UPDATE "User" u SET "roleId" = (SELECT id FROM "Role" WHERE slug = 'platform_admin' AND "restaurantId" IS NULL LIMIT 1)
    WHERE u."role"::text = 'ADMIN';
    UPDATE "User" u SET "roleId" = (SELECT id FROM "Role" WHERE slug = 'pending_owner' AND "restaurantId" IS NULL LIMIT 1)
    WHERE u."role"::text = 'OWNER';
    UPDATE "User" u SET "roleId" = (SELECT id FROM "Role" WHERE slug = 'pending_worker' AND "restaurantId" IS NULL LIMIT 1)
    WHERE u."role"::text = 'WORKER';
    UPDATE "User" SET "roleId" = NULL WHERE "role"::text = 'UNKNOW';
    ALTER TABLE "User" DROP COLUMN "role";
  END IF;
END $$;

DROP TYPE IF EXISTS "UserRole";

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_roleId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
