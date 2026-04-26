const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    include: { eventRoles: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

run().finally(() => prisma.$disconnect());
