import { PrismaClient } from '@prisma/client';
import { fakeProductStockComplete } from './fake-data';
import { seedDemoRestaurant } from './seed-demo-restaurant';
import { seedDefaultGlobalRoles } from './seed-roles';

const prisma = new PrismaClient();

async function main() {
  await seedDefaultGlobalRoles(prisma);
  await seedDemoRestaurant(prisma);

  await prisma.$executeRaw`
    INSERT INTO "SubscriptionCatalog" ("id","plan","name","price","priceLabel","description","features","createdAt","updatedAt")
    VALUES
      ('subcat_starter','STARTER','Starter',29,'$29/mo','Perfect for one small location getting online.',ARRAY['1 Branch','Menu management','Order dashboard','Basic analytics'],now(),now()),
      ('subcat_growth','GROWTH','Growth',79,'$79/mo','For growing restaurants and multiple teams.',ARRAY['Up to 5 branches','Role-based users','Advanced analytics','Branding and banners'],now(),now()),
      ('subcat_scale','SCALE','Scale',0,'Custom','Enterprise setup for multi-brand operations.',ARRAY['Unlimited branches','Priority support','Custom integrations','Dedicated onboarding'],now(),now())
    ON CONFLICT ("plan") DO NOTHING
  `;

  await prisma.productStock.deleteMany({});
  const fakerRounds = 40;
  for (let i = 0; i < fakerRounds; i++) {
    const product = await prisma.productStock.create({
      data: {
        ...fakeProductStockComplete(),
      },
    });
    console.log(`Created product stock with id ${product.id}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
