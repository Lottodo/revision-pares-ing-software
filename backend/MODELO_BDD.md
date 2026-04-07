# Modelo de Base de Datos (Sequelize + MySQL)

Este documento describe el modelo relacional definido en Backend para el sistema de revision por pares.

## Tecnologia

- ORM: Sequelize v6
- Motor de BDD objetivo: MySQL
- Driver: mysql2
- Configuracion base: [config/database.js](config/database.js)

## Convenciones del modelo

- `underscored: true`: Sequelize usa nombres en snake_case en columnas automaticas.
- `timestamps: true`: todas las tablas incluyen `created_at` y `updated_at`.
- `freezeTableName: true`: se respeta el nombre de tabla definido en cada modelo.
- PK principal: `INTEGER UNSIGNED AUTO_INCREMENT`.

## Entidades

### 1. usuarios

Modelo: [models/usuario.model.js](models/usuario.model.js)

Campos principales:
- `id` (PK)
- `username` (unico, requerido)
- `email` (unico, requerido)
- `password_hash` (requerido)
- `rol` (`autor`, `revisor`, `editor`)
- `activo` (boolean, default `true`)
- `created_at`, `updated_at`

### 2. articulos

Modelo: [models/articulo.model.js](models/articulo.model.js)

Campos principales:
- `id` (PK)
- `titulo` (requerido)
- `resumen` (requerido)
- `documento_url` (requerido)
- `estado` (`recibido`, `en_revision`, `cambios_menores`, `cambios_mayores`, `aceptado`, `rechazado`)
- `fecha_envio`
- `autor_id` (FK -> `usuarios.id`)
- `created_at`, `updated_at`

### 3. asignaciones_revision

Modelo: [models/asignacionRevision.model.js](models/asignacionRevision.model.js)

Campos principales:
- `id` (PK)
- `articulo_id` (FK -> `articulos.id`)
- `revisor_id` (FK -> `usuarios.id`)
- `estado` (`pendiente`, `en_progreso`, `evaluado`, `cancelado`)
- `fecha_asignacion`
- `fecha_limite`
- `created_at`, `updated_at`

Restricciones:
- Indice unico compuesto: (`articulo_id`, `revisor_id`)

### 4. evaluaciones

Modelo: [models/evaluacion.model.js](models/evaluacion.model.js)

Campos principales:
- `id` (PK)
- `articulo_id` (FK -> `articulos.id`)
- `revisor_id` (FK -> `usuarios.id`)
- `veredicto` (`aceptar`, `cambios_menores`, `cambios_mayores`, `rechazar`)
- `comentarios`
- `fecha_evaluacion`
- `created_at`, `updated_at`

## Relaciones

Definidas en [models/index.js](models/index.js):

1. Usuario (autor) 1:N Articulo
- `Usuario.hasMany(Articulo, { foreignKey: 'autorId', as: 'articulos' })`
- `Articulo.belongsTo(Usuario, { foreignKey: 'autorId', as: 'autor' })`

2. Articulo N:M Usuario (revisores) mediante AsignacionRevision
- `Articulo.belongsToMany(Usuario, { through: AsignacionRevision, foreignKey: 'articuloId', otherKey: 'revisorId', as: 'revisores' })`
- `Usuario.belongsToMany(Articulo, { through: AsignacionRevision, foreignKey: 'revisorId', otherKey: 'articuloId', as: 'asignaciones' })`

3. Articulo 1:N Evaluacion
- `Articulo.hasMany(Evaluacion, { foreignKey: 'articuloId', as: 'evaluaciones' })`
- `Evaluacion.belongsTo(Articulo, { foreignKey: 'articuloId', as: 'articulo' })`

4. Usuario (revisor) 1:N Evaluacion
- `Usuario.hasMany(Evaluacion, { foreignKey: 'revisorId', as: 'evaluacionesRealizadas' })`
- `Evaluacion.belongsTo(Usuario, { foreignKey: 'revisorId', as: 'revisor' })`

5. Enlaces directos de AsignacionRevision
- `AsignacionRevision.belongsTo(Articulo, { foreignKey: 'articuloId', as: 'articulo' })`
- `AsignacionRevision.belongsTo(Usuario, { foreignKey: 'revisorId', as: 'revisor' })`

## Migracion inicial

La migracion inicial del esquema se encuentra en:
- [migrations/202604060001-initial-schema.cjs](migrations/202604060001-initial-schema.cjs)

Esa migracion crea tablas, llaves foraneas e indice unico para el modelo actual.

## Ejecucion con sequelize-cli (cuando decidan migrar)

Wiring preparado:
- Configuracion de CLI: [config/sequelize-cli.cjs](config/sequelize-cli.cjs)
- Rutas de CLI: [.sequelizerc](../.sequelizerc)
- Script de ejemplo de variables: [.env.example](.env.example)

Scripts npm disponibles en la raiz del proyecto:
- `npm run db:migrate`
- `npm run db:migrate:undo`
- `npm run db:migrate:undo:all`
- `npm run db:migration:status`

Antes de ejecutar migraciones, definir variables de entorno reales para MySQL (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
