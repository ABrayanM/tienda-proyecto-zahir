# Guía Rápida de Instalación

## Paso 1: Instalar Node.js y MySQL

### Windows
1. Descarga Node.js desde https://nodejs.org/
2. Descarga MySQL desde https://dev.mysql.com/downloads/installer/
3. Instala ambos programas siguiendo los asistentes

### macOS
```bash
# Usando Homebrew
brew install node
brew install mysql
```

### Linux (Ubuntu/Debian)
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL
sudo apt-get install mysql-server
```

## Paso 2: Configurar MySQL

1. Inicia el servidor MySQL
2. Accede a MySQL:
```bash
mysql -u root -p
```

3. Ejecuta el script de base de datos:
```bash
# Desde la terminal (fuera de MySQL)
mysql -u root -p < database/schema.sql
```

O desde MySQL:
```sql
source database/schema.sql;
```

## Paso 3: Configurar la Aplicación

1. Copia el archivo de configuración:
```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=tienda_zahir
```

## Paso 4: Instalar Dependencias

```bash
npm install
```

## Paso 5: Iniciar la Aplicación

### Desarrollo (con auto-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

## Verificación

Abre tu navegador y visita: http://localhost:3000

Deberías ver la página de login. Usa estas credenciales para probar:
- **Usuario**: zahir
- **Contraseña**: programador

## Solución de Problemas Comunes

### Error: "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Asegúrate que el puerto 3306 no esté bloqueado

### Error: "Port 3000 already in use"
- Cambia el puerto en `.env`:
  ```env
  PORT=3001
  ```

### Error: "Module not found"
- Ejecuta nuevamente:
  ```bash
  npm install
  ```

### La base de datos no tiene datos
- Ejecuta el script SQL nuevamente:
  ```bash
  mysql -u root -p < database/schema.sql
  ```

## Verificar Instalación de MySQL

### Windows
```bash
mysql --version
```

### macOS/Linux
```bash
mysql --version
# Iniciar servicio
sudo service mysql start  # Linux
brew services start mysql # macOS
```

## Crear Base de Datos Manualmente

Si el script automático falla, puedes crear la base de datos manualmente:

```sql
CREATE DATABASE tienda_zahir CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_zahir;
-- Luego ejecuta el resto del script desde database/schema.sql
```

## Respaldo de Datos

Para hacer un respaldo de tu base de datos:

```bash
mysqldump -u root -p tienda_zahir > backup.sql
```

Para restaurar:

```bash
mysql -u root -p tienda_zahir < backup.sql
```

## Siguientes Pasos

Una vez la aplicación esté corriendo:

1. Cambia las contraseñas por defecto
2. Agrega tus propios productos
3. Configura el logo de tu tienda
4. Empieza a registrar ventas

¡Listo para usar! 🎉
