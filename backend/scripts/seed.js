// backend/scripts/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// Rutas
const papersDir = path.resolve(__dirname, '../../PAPERS');
const uploadsDir = path.resolve(__dirname, '../uploads');

// Crear carpetas de uploads si no existen
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper para generar 100 usuarios con nombres realistas
const generateUsers = async () => {
  const users = [];
  const hashedPassword = await bcrypt.hash('1234', 10);
  
  // Agregar admin global (Obligatorio)
  users.push({
    username: 'admin_root',
    email: 'admin@qa.com',
    passwordHash: hashedPassword,
    isGlobalAdmin: true,
  });

  // Agregar cuenta multiusuario explícita para pruebas
  users.push({
    username: 'multi_user',
    email: 'multi@qa.com',
    passwordHash: hashedPassword,
    isGlobalAdmin: false,
  });

  // --- NUEVOS USUARIOS DE PRUEBA ---
  users.push({
    username: 'revisor_pro',
    email: 'revisor@prueba.com',
    passwordHash: hashedPassword,
    isGlobalAdmin: false,
  });

  users.push({
    username: 'autor_pro',
    email: 'autor@prueba.com',
    passwordHash: hashedPassword,
    isGlobalAdmin: false,
  });

  users.push({
    username: 'editor_pro',
    email: 'editor@prueba.com',
    passwordHash: hashedPassword,
    isGlobalAdmin: false,
  });

  // Generar 98 usuarios más
  const names = ['Ana', 'Carlos', 'Elena', 'Fernando', 'Sofia', 'Miguel', 'Lucia', 'Jorge', 'Maria', 'Pedro', 'Laura', 'David', 'Carmen', 'Raul', 'Isabel', 'Hugo', 'Marta', 'Alejandro', 'Paula', 'Diego'];
  const surnames = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Gomez', 'Martin', 'Jimenez', 'Ruiz', 'Hernandez', 'Diaz', 'Moreno', 'Alvarez', 'Romero', 'Alonso', 'Gutierrez', 'Navarro', 'Torres'];

  for (let i = 1; i <= 98; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const username = `${name.toLowerCase()}.${surname.toLowerCase()}${i}`;
    users.push({
      username,
      email: `${username}@test.com`,
      passwordHash: hashedPassword,
      isGlobalAdmin: false,
    });
  }

  // Insertar todos y obtener IDs
  await prisma.user.createMany({ data: users });
  return await prisma.user.findMany();
};

async function seed() {
  console.log("\n🚀 Iniciando seed masivo realista...\n");

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

  console.log("👥 Creando 100 usuarios...");
  const dbUsers = await generateUsers();
  const nonAdmins = dbUsers.filter(u => !u.isGlobalAdmin);
  const multiUser = dbUsers.find(u => u.username === 'multi_user');
  console.log("✔ Usuarios creados\n");

  console.log("🏛️ Escaneando áreas de estudio y copiando PDFs...");
  const areas = [];
  if (fs.existsSync(papersDir)) {
    const folders = fs.readdirSync(papersDir).filter(f => fs.statSync(path.join(papersDir, f)).isDirectory());
    for (const folder of folders) {
      const areaEvent = await prisma.event.create({
        data: { slug: folder.toLowerCase(), name: `Congreso de ${folder}`, active: true }
      });
      
      const sourceFolder = path.join(papersDir, folder);
      const destFolder = path.join(uploadsDir, folder);
      if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

      const files = fs.readdirSync(sourceFolder).filter(f => f.endsWith('.pdf'));
      const copiedFiles = [];
      for (const file of files) {
        fs.copyFileSync(path.join(sourceFolder, file), path.join(destFolder, file));
        // Guardamos ruta relativa para el backend
        copiedFiles.push(`http://localhost:3000/uploads/${folder}/${encodeURIComponent(file)}`);
      }
      areas.push({ event: areaEvent, files: copiedFiles, name: folder });
    }
  }

  // Si no había carpetas en PAPERS, creamos unas por defecto
  if (areas.length === 0) {
    console.log("⚠️ No se encontraron carpetas en PAPERS. Creando eventos por defecto...");
    const defaultAreas = ['INGENIERIA', 'HISTORIA', 'ECONOMIA'];
    for (const folder of defaultAreas) {
      const ev = await prisma.event.create({ data: { slug: folder.toLowerCase(), name: `Congreso de ${folder}` }});
      areas.push({ event: ev, files: [], name: folder });
    }
  }
  console.log("✔ Eventos (Áreas) creados\n");

  console.log("🎭 Asignando roles a los usuarios...");
  const allRoles = [];
  const eventUserMap = {}; // eventId -> { EDITOR: [], REVIEWER: [], AUTHOR: [] }

  // Buscamos a nuestros usuarios pro
  const revisorPro = dbUsers.find(u => u.username === 'revisor_pro');
  const autorPro = dbUsers.find(u => u.username === 'autor_pro');
  const editorPro = dbUsers.find(u => u.username === 'editor_pro');

  for (let idx = 0; idx < areas.length; idx++) {
    const area = areas[idx];
    const evId = area.event.id;
    eventUserMap[evId] = { EDITOR: [], REVIEWER: [], AUTHOR: [] };
    
    // Shuffle usuarios para distribuir
    const shuffled = [...nonAdmins].sort(() => 0.5 - Math.random());
    
    // Dejar un pool para editores, revisores y autores
    const editors = shuffled.slice(0, 5);
    const reviewers = shuffled.slice(5, 20);
    const authors = shuffled.slice(20, 60);

    // FORZAR USUARIOS PRO EN EL PRIMER EVENTO
    if (idx === 0) {
      reviewers.push(revisorPro);
      authors.push(autorPro);
      editors.push(editorPro);
    }

    // Asegurarse de que multi_user tenga un rol diferente en distintos eventos
    // Evento 0: AUTHOR, Evento 1: REVIEWER, Evento 2: EDITOR
    if (idx === 0) {
      if(!authors.includes(multiUser)) authors.push(multiUser);
    } else if (idx === 1) {
      if(!reviewers.includes(multiUser)) reviewers.push(multiUser);
    } else if (idx === 2) {
      if(!editors.includes(multiUser)) editors.push(multiUser);
    }

    editors.forEach(u => {
      allRoles.push({ userId: u.id, eventId: evId, role: 'EDITOR' });
      eventUserMap[evId].EDITOR.push(u);
    });
    reviewers.forEach(u => {
      allRoles.push({ userId: u.id, eventId: evId, role: 'REVIEWER' });
      eventUserMap[evId].REVIEWER.push(u);
    });
    authors.forEach(u => {
      allRoles.push({ userId: u.id, eventId: evId, role: 'AUTHOR' });
      eventUserMap[evId].AUTHOR.push(u);
    });
  }

  // Para evitar duplicados en bulk insert, filtramos por si multiUser se pusheó doble:
  const uniqueRoles = allRoles.filter((v, i, a) => a.findIndex(t => (t.userId === v.userId && t.eventId === v.eventId && t.role === v.role)) === i);

  await prisma.eventUser.createMany({ data: uniqueRoles });
  console.log("✔ Roles asignados\n");

  console.log("📄 Creando Papers y Revisiones...");
  const STATUSES = ['RECEIVED', 'UNDER_REVIEW', 'MINOR_CHANGES', 'MAJOR_CHANGES', 'ACCEPTED', 'REJECTED', 'COMPLETED'];

  for (const area of areas) {
    const evId = area.event.id;
    const authorsInEvent = eventUserMap[evId].AUTHOR;
    const reviewersInEvent = eventUserMap[evId].REVIEWER;
    const editorsInEvent = eventUserMap[evId].EDITOR;

    // Si hay archivos reales, hacemos uno por cada archivo. Si no, generamos dummies.
    const papersToCreate = area.files.length > 0 ? area.files.length : 15;

    for (let i = 0; i < papersToCreate; i++) {
      const docUrl = area.files.length > 0 ? area.files[i] : `http://example.com/dummy_${area.name}_${i}.pdf`;
      const author = authorsInEvent[i % authorsInEvent.length];
      const editor = editorsInEvent[i % editorsInEvent.length];
      
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

      const paper = await prisma.paper.create({
        data: {
          title: `Investigación en ${area.name} - Parte ${i + 1}`,
          abstract: `Este artículo explora nuevas metodologías en el campo de ${area.name}. Fue desarrollado por un equipo multidisciplinario enfocado en la mejora continua de la disciplina.`,
          documentUrl: docUrl,
          status: status,
          eventId: evId,
          authorId: author.id,
          versions: {
            create: [{ version: 1, url: docUrl }]
          }
        }
      });

      await prisma.paperHistory.create({
        data: { paperId: paper.id, event: 'Manuscrito recibido', detail: 'Versión 1 subida por el autor.', userId: author.id }
      });

      // Crear asignaciones / revisiones si el estado indica avance
      if (['UNDER_REVIEW', 'MINOR_CHANGES', 'MAJOR_CHANGES', 'ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
        // Asignar a 2 revisores
        const rev1 = reviewersInEvent[(i * 2) % reviewersInEvent.length];
        const rev2 = reviewersInEvent[(i * 2 + 1) % reviewersInEvent.length];

        const assign1 = await prisma.assignment.create({
          data: { paperId: paper.id, reviewerId: rev1.id, status: ['RECEIVED', 'UNDER_REVIEW'].includes(status) ? 'IN_PROGRESS' : 'EVALUATED' }
        });
        const assign2 = await prisma.assignment.create({
          data: { paperId: paper.id, reviewerId: rev2.id, status: ['RECEIVED', 'UNDER_REVIEW'].includes(status) ? 'IN_PROGRESS' : 'EVALUATED' }
        });

        if (['MINOR_CHANGES', 'MAJOR_CHANGES', 'ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
          // Crear dictamen del revisor 1
          await prisma.review.create({
            data: {
              paperId: paper.id, reviewerId: rev1.id, assignmentId: assign1.id,
              verdict: status === 'REJECTED' ? 'REJECT' : (status === 'ACCEPTED' || status === 'COMPLETED' ? 'ACCEPT' : status),
              originality: Math.floor(Math.random() * 3) + 3,
              methodologicalRigor: Math.floor(Math.random() * 3) + 3,
              writingQuality: Math.floor(Math.random() * 3) + 3,
              relevance: Math.floor(Math.random() * 3) + 3,
              comments: `Comentarios detallados sobre el trabajo de ${area.name}. Sugiero revisar la metodología y ampliar la introducción.`
            }
          });
          
          await prisma.paperHistory.create({
            data: { paperId: paper.id, event: `Decisión editorial: ${status}`, detail: `Editor dictaminó el artículo como ${status}.`, userId: editor.id }
          });
        }
      }
    }
  }
  console.log("✔ Papers generados e historias simuladas\n");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ SEED MASIVO COMPLETADO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n👤 CUENTAS CLAVE PARA PRUEBAS:");
  console.log("👉 Admin Global:  admin@qa.com / 1234");
  console.log("👉 Multiusuario:  multi@qa.com / 1234  (Tiene distintos roles en distintas áreas)");
  console.log("👉 Revisor Fijo:  revisor@prueba.com / 1234 ");
  console.log("👉 Autor Fijo:    autor@prueba.com / 1234 ");
  console.log("👉 Editor Fijo:   editor@prueba.com / 1234 ");
  console.log("\n(Los otros 98 usuarios tienen contraseñas '1234' y nombres del tipo 'ana.garcia1@test.com')\n");
}

seed()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });