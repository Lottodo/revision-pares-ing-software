# README - Plataforma de Peer Review "Pro Max"

## Descripción General
Plataforma institucional con arquitectura JWT + Mongoose + Vue3 + Vuetify, estructurada para manejar flujos de revisión de a pares ciegos (Doble Ciego) con estrictos niveles de autorización.

---

## 🚀 Cómo iniciar la aplicación

Puedes levantar la plataforma de dos maneras distintas: de forma nativa (manual) si tienes Node.js, o contenerizada mediante Docker.

### 1. Forma Manual (Modo Desarrollo)
Asegúrate de contar con Node.js v20+ instalado.

1. **Instalación Inicial:**
   En la raíz del proyecto, abre una terminal y corre:
   ```bash
   npm install
   ```

2. **Levantar el Backend:**
   Abre una terminal en la raíz y ejecuta el servidor de la API:
   ```bash
   npm run start:backend
   ```
   *(El servidor escuchará en el puerto `3000`)*

3. **Levantar el Frontend:**
   Abre **otra** terminal paralela en la raíz y ejecuta Vite:
   ```bash
   npm run dev
   ```
   *(La interfaz levantará en `http://localhost:5173`. Todo el tráfico de API se reenviará automáticamente por el proxy configurado en `vite.config.js` al puerto 3000).*


### 2. Forma con Docker (Recomendada)
Si tienes **Docker Desktop** (o Docker Engine + Docker Compose) instalado, levantar toda la arquitectura es completamente automático.

1. Abre tu terminal en la raíz de este proyecto (donde vive `docker-compose.yml`).
2. Ejecuta:
   ```bash
   docker-compose up --build -d
   ```
3. Docker orquestará los dos contenedores en paralelo (`peer_review_frontend` y `peer_review_backend`). 
4. Accede a la plataforma ingresando a `http://localhost:5173`. Las llamadas internas hacia el puerto 3000 estarán expuestas correctamente.
*(Para detener el entorno local: `docker-compose down`).*

---

> **Tip de Acceso Rápido:** No es necesario crear cuentas. Contamos con una base de datos semilla viva en MongoDB Atlas con los siguientes usuarios (contraseña `1234` para todos):
> - `autor1` (Sube artículos)
> - `editor1` (Asigna artículos y decide su publicación)
> - `revisor1` (Lee y remite dictámenes)
