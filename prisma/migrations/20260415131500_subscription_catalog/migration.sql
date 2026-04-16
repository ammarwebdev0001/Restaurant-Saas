-- CreateTable
CREATE TABLE "SubscriptionCatalog" (
    "id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCatalog_plan_key" ON "SubscriptionCatalog"("plan");

-- Seed fixed 3 plans
INSERT INTO "SubscriptionCatalog" ("id","plan","name","priceLabel","description","features","createdAt","updatedAt")
VALUES
  ('subcat_starter','STARTER','Starter','$29/mo','Perfect for one small location getting online.',ARRAY['1 Branch','Menu management','Order dashboard','Basic analytics'],now(),now()),
  ('subcat_growth','GROWTH','Growth','$79/mo','For growing restaurants and multiple teams.',ARRAY['Up to 5 branches','Role-based users','Advanced analytics','Branding and banners'],now(),now()),
  ('subcat_scale','SCALE','Scale','Custom','Enterprise setup for multi-brand operations.',ARRAY['Unlimited branches','Priority support','Custom integrations','Dedicated onboarding'],now(),now())
ON CONFLICT ("plan") DO NOTHING;
