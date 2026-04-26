import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const events = await prisma.event.findMany({ select: { id: true, name: true, slug: true } });
console.log('\n📅 EVENTOS:');
events.forEach(e => console.log(`  [${e.id}] ${e.name} (slug: ${e.slug})`));

const mu = await prisma.user.findFirst({ 
  where: { username: 'multi_user' }, 
  include: { eventRoles: { include: { event: { select: { name: true } } } } } 
});
console.log('\n👤 MULTI_USER roles:');
mu.eventRoles.forEach(r => console.log(`  ${r.role} en "${r.event.name}"`));

for (const ev of events) {
  console.log(`\n--- ${ev.name} ---`);
  const roles = ['EDITOR', 'REVIEWER', 'AUTHOR'];
  for (const role of roles) {
    const eu = await prisma.eventUser.findFirst({ 
      where: { eventId: ev.id, role }, 
      include: { user: { select: { email: true, username: true } } } 
    });
    if (eu) console.log(`  ${role}: ${eu.user.email} (${eu.user.username})`);
  }
}

await prisma.$disconnect();
