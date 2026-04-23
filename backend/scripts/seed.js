// backend/scripts/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log("\n🚀 Iniciando seed...\n");

  // =========================
  // 🧹 LIMPIEZA (orden correcto por FK)
  // =========================
  console.log("🧹 Limpiando base de datos...");

  await prisma.review.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.paperVersion.deleteMany();
  await prisma.paperHistory.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.eventUser.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log("✔ Base de datos limpia\n");

  // =========================
  // 🔐 PASSWORD
  // =========================
  const hashedPassword = await bcrypt.hash('1234', 10);

  // =========================
  // 👥 USUARIOS
  // =========================
  console.log("👥 Creando usuarios...");

  const admin = await prisma.user.create({
    data: {
      username: 'admin_root',
      email: 'admin@qa.com',
      passwordHash: hashedPassword
    }
  });

  const autor = await prisma.user.create({
    data: {
      username: 'autor_multi',
      email: 'autor@qa.com',
      passwordHash: hashedPassword
    }
  });

  const editor = await prisma.user.create({
    data: {
      username: 'editor_multi',
      email: 'editor@qa.com',
      passwordHash: hashedPassword
    }
  });

  const revisor = await prisma.user.create({
    data: {
      username: 'revisor_multi',
      email: 'revisor@qa.com',
      passwordHash: hashedPassword
    }
  });

  const multi = await prisma.user.create({
    data: {
      username: 'multi_extremo',
      email: 'multi@qa.com',
      passwordHash: hashedPassword
    }
  });

  console.log("✔ Usuarios creados\n");

  // =========================
  // 🏛️ EVENTOS
  // =========================
  console.log("🏛️ Creando eventos...");

  const eventoA = await prisma.event.create({
    data: { slug: 'ia-qa-2026', name: 'Congreso IA QA 2026' }
  });

  const eventoB = await prisma.event.create({
    data: { slug: 'software-qa-2026', name: 'Simposio Software QA 2026' }
  });

  const eventoC = await prisma.event.create({
    data: { slug: 'redes-qa-2026', name: 'Taller Redes QA 2026' }
  });

  console.log("✔ Eventos creados\n");

  // =========================
  // 🎭 ROLES (EventUser)
  // =========================
  console.log("🎭 Asignando roles...");

  await prisma.eventUser.createMany({
    data: [
      { userId: admin.id, eventId: eventoA.id, role: 'ADMIN' },
      { userId: admin.id, eventId: eventoB.id, role: 'ADMIN' },
      { userId: admin.id, eventId: eventoC.id, role: 'ADMIN' },

      { userId: autor.id, eventId: eventoA.id, role: 'AUTHOR' },
      { userId: autor.id, eventId: eventoB.id, role: 'AUTHOR' },

      { userId: editor.id, eventId: eventoB.id, role: 'EDITOR' },
      { userId: editor.id, eventId: eventoC.id, role: 'EDITOR' },

      { userId: revisor.id, eventId: eventoA.id, role: 'REVIEWER' },
      { userId: revisor.id, eventId: eventoC.id, role: 'REVIEWER' },

      { userId: multi.id, eventId: eventoA.id, role: 'AUTHOR' },
      { userId: multi.id, eventId: eventoB.id, role: 'REVIEWER' },
      { userId: multi.id, eventId: eventoC.id, role: 'EDITOR' },
    ]
  });

  console.log("✔ Roles asignados\n");

  // =========================
  // 📄 PAPERS
  // =========================
  console.log("📄 Creando papers...");

  const paper1 = await prisma.paper.create({
    data: {
      title: 'Paper QA - Prueba Inicial',
      abstract: 'Paper para pruebas QA',
      documentUrl: 'http://example.com/paper1.pdf',
      status: 'RECEIVED',
      eventId: eventoA.id,
      authorId: autor.id
    }
  });

  const paper2 = await prisma.paper.create({
    data: {
      title: 'Paper QA - Multiusuario',
      abstract: 'Paper del usuario extremo',
      documentUrl: 'http://example.com/paper2.pdf',
      status: 'UNDER_REVIEW',
      eventId: eventoB.id,
      authorId: multi.id
    }
  });

  console.log("✔ Papers creados\n");

  // =========================
  // 🧪 REVIEW (correcto según schema)
  // =========================
  console.log("🧪 Creando reviews...");

  const assignment = await prisma.assignment.create({
    data: {
      paperId: paper2.id,
      reviewerId: revisor.id,
      status: 'IN_PROGRESS'
    }
  });

  await prisma.review.create({
    data: {
      paperId: paper2.id,
      reviewerId: revisor.id,
      assignmentId: assignment.id,
      verdict: 'ACCEPT',
      originality: 4,
      methodologicalRigor: 4,
      writingQuality: 5,
      relevance: 4,
      comments: 'Review inicial de prueba'
    }
  });

  console.log("✔ Reviews creadas\n");

  // =========================
  // 📊 RESULTADO
  // =========================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ SEED COMPLETADO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n👤 LOGIN TEST:");
  console.log("admin@qa.com / 1234");
  console.log("autor@qa.com / 1234");
  console.log("revisor@qa.com / 1234\n");
}

seed()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });