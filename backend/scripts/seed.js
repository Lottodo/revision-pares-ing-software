import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log("\n[Seed QA] 🚀 Iniciando...\n");

  // =========================
  // 🧹 LIMPIEZA (ORDEN CORRECTO)
  // =========================
  console.log("[Seed QA] Limpiando...");

  await prisma.review.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.paperHistory.deleteMany();
  await prisma.paperVersion.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.eventUser.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log("[Seed QA] ✓ Base limpia\n");

  // =========================
  // 🔐 PASSWORD
  // =========================
  const passwordHash = await bcrypt.hash("1234", 10);

  // =========================
  // 👥 USUARIOS
  // =========================
  console.log("[Seed QA] Creando usuarios...");

  const admin = await prisma.user.create({
    data: {
      username: "admin_root",
      email: "admin@qa.com",
      passwordHash
    }
  });

  const autor = await prisma.user.create({
    data: {
      username: "autor_multi",
      email: "autor@qa.com",
      passwordHash
    }
  });

  const editor = await prisma.user.create({
    data: {
      username: "editor_multi",
      email: "editor@qa.com",
      passwordHash
    }
  });

  const revisor = await prisma.user.create({
    data: {
      username: "revisor_multi",
      email: "revisor@qa.com",
      passwordHash
    }
  });

  const multi = await prisma.user.create({
    data: {
      username: "multi_extremo",
      email: "multi@qa.com",
      passwordHash
    }
  });

  console.log("[Seed QA] ✓ Usuarios creados\n");

  // =========================
  // 🏛️ EVENTOS
  // =========================
  console.log("[Seed QA] Creando eventos...");

  const eventoA = await prisma.event.create({
    data: {
      slug: "ia-qa-2026",
      name: "Congreso IA QA 2026"
    }
  });

  const eventoB = await prisma.event.create({
    data: {
      slug: "sw-qa-2026",
      name: "Simposio Software QA 2026"
    }
  });

  const eventoC = await prisma.event.create({
    data: {
      slug: "redes-qa-2026",
      name: "Taller Redes QA 2026"
    }
  });

  console.log("[Seed QA] ✓ Eventos creados\n");

  // =========================
  // 🎭 ROLES
  // =========================
  console.log("[Seed QA] Asignando roles...");

  await prisma.eventUser.createMany({
    data: [
      // ADMIN
      { userId: admin.id, eventId: eventoA.id, role: "ADMIN" },
      { userId: admin.id, eventId: eventoB.id, role: "ADMIN" },
      { userId: admin.id, eventId: eventoC.id, role: "ADMIN" },

      // AUTOR
      { userId: autor.id, eventId: eventoA.id, role: "AUTHOR" },
      { userId: autor.id, eventId: eventoB.id, role: "AUTHOR" },

      // EDITOR
      { userId: editor.id, eventId: eventoB.id, role: "EDITOR" },
      { userId: editor.id, eventId: eventoC.id, role: "EDITOR" },

      // REVIEWER
      { userId: revisor.id, eventId: eventoA.id, role: "REVIEWER" },
      { userId: revisor.id, eventId: eventoC.id, role: "REVIEWER" },

      // MULTI EXTREMO
      { userId: multi.id, eventId: eventoA.id, role: "AUTHOR" },
      { userId: multi.id, eventId: eventoB.id, role: "REVIEWER" },
      { userId: multi.id, eventId: eventoC.id, role: "EDITOR" }
    ]
  });

  console.log("[Seed QA] ✓ Roles asignados\n");

  // =========================
  // 📄 PAPERS
  // =========================
  console.log("[Seed QA] Creando papers...");

  const paper1 = await prisma.paper.create({
    data: {
      title: "Paper QA Autor",
      abstract: "Prueba QA",
      documentUrl: "/uploads/test1.pdf",
      eventId: eventoA.id,
      authorId: autor.id
    }
  });

  const paper2 = await prisma.paper.create({
    data: {
      title: "Paper QA Multi",
      abstract: "Prueba extrema",
      documentUrl: "/uploads/test2.pdf",
      status: "UNDER_REVIEW",
      eventId: eventoB.id,
      authorId: multi.id
    }
  });

  console.log("[Seed QA] ✓ Papers creados\n");

  // =========================
  // 📋 ASIGNACIÓN
  // =========================
  console.log("[Seed QA] Creando asignación...");

  const assignment = await prisma.assignment.create({
    data: {
      paperId: paper2.id,
      reviewerId: revisor.id,
      status: "IN_PROGRESS"
    }
  });

  console.log("[Seed QA] ✓ Asignación creada\n");

  // =========================
  // ⭐ REVIEW
  // =========================
  console.log("[Seed QA] Creando review...");

  await prisma.review.create({
    data: {
      paperId: paper2.id,
      reviewerId: revisor.id,
      assignmentId: assignment.id,
      verdict: "MINOR_CHANGES",
      originality: 4,
      methodologicalRigor: 4,
      writingQuality: 3,
      relevance: 5,
      comments: "Review QA inicial"
    }
  });

  console.log("[Seed QA] ✓ Review creada\n");

  // =========================
  // 📊 FINAL
  // =========================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ SEED LISTO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\nUsuarios:");
  console.log("admin_root / 1234");
  console.log("autor_multi / 1234");
  console.log("editor_multi / 1234");
  console.log("revisor_multi / 1234");
  console.log("multi_extremo / 1234\n");
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());