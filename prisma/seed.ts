import { PrismaClient } from '@prisma/client';
import { fakeProductStockComplete } from './fake-data';
import { seedDemoRestaurant } from './seed-demo-restaurant';
import { seedDefaultGlobalRoles } from './seed-roles';

const prisma = new PrismaClient();

async function main() {
  await seedDefaultGlobalRoles(prisma);
  await seedDemoRestaurant(prisma);

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
