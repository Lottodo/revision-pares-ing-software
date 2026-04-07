# Como correr el backend en local (Windows primero)

Esta guia esta pensada para Windows (PowerShell o CMD).

1. Verificar que MySQL 10 este instalado lanzando este comando desde el CMD:

```sh
mysql --version
```

2. Instalar dependencias del proyecto en la raiz:

```sh
npm install
```

3. Configurar variables de entorno del backend creando `backend/.env` con este formato:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peerreview
DB_USER=peerreview_user
DB_PASSWORD=ing_software
DB_LOG_SQL=false
```

4. En Windows, abrir PowerShell o CMD y ejecutar este comando para crear base de datos, usuario y permisos (como root en MySQL):

```sh
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS peerreview CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'peerreview_user'@'localhost' IDENTIFIED BY 'ing_software'; GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES ON peerreview.* TO 'peerreview_user'@'localhost'; FLUSH PRIVILEGES;"
```

Si `mysql` no se reconoce en Windows, ejecuta el cliente desde la carpeta `bin` de tu instalacion de MySQL o agrega MySQL al `PATH`.

Validar que el usuario exista (Windows):

```sh
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User='peerreview_user';"
```

5. Aplicar migraciones:

```sh
npm run db:migrate
```

6. Cargar datos iniciales (usuarios de prueba):

```sh
npm run db:seed
```

7. Iniciar el backend:

```sh
node backend/server-poc.js
```

8. Verificar que responde en:

- http://localhost:3000

Nota para Linux/macOS: los mismos comandos funcionan igual en terminal bash/zsh.
