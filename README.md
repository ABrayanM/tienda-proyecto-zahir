# Tienda de Abarrotes - Sistema de Gestión

Sistema de gestión para tienda de abarrotes con MySQL como base de datos backend.

## 📋 Características

- **Autenticación de usuarios** con roles (ADMIN / CAJERO)
- **Gestión de productos** (CRUD completo)
- **Sistema de ventas** con carrito de compras
- **Reportes** de ventas e ingresos
- **Configuración** personalizable (logo, etc.)
- **Base de datos MySQL** para almacenamiento persistente

## 🚀 Requisitos Previos

- Node.js (v14 o superior)
- MySQL Server (v5.7 o superior)
- npm o yarn

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd tienda-proyecto-zahir
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

#### a) Crear archivo de configuración

Copiar el archivo de ejemplo y editarlo con tus credenciales:

```bash
cp .env.example .env
```

#### b) Editar `.env` con tus datos:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=tienda_zahir
DB_PORT=3306

PORT=3000
NODE_ENV=development

SESSION_SECRET=cambia_este_secreto_en_produccion
```

#### c) Inicializar la base de datos

```bash
npm run init-db
```

Este comando:
- Crea la base de datos `tienda_zahir`
- Crea todas las tablas necesarias
- Inserta usuarios predeterminados
- Inserta productos de ejemplo

## 🎮 Uso

### Iniciar el servidor

```bash
npm start
```

O en modo desarrollo (con auto-reload):

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

### Usuarios Predeterminados

Después de inicializar la base de datos, puedes acceder con:

| Usuario | Contraseña    | Rol    |
|---------|--------------|--------|
| zahir   | programador  | ADMIN  |
| brayan  | cajero       | ADMIN  |
| cajero  | 1234         | CAJERO |

## 🗄️ Estructura de la Base de Datos

### Tablas

- **users**: Usuarios del sistema con autenticación
- **products**: Catálogo de productos
- **sales**: Registro de ventas realizadas
- **sale_items**: Detalles de items en cada venta
- **settings**: Configuraciones del sistema

## 🔌 API Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/session` - Verificar sesión activa

### Productos

- `GET /api/products` - Listar todos los productos
- `GET /api/products/:id` - Obtener un producto
- `POST /api/products` - Crear producto (ADMIN)
- `PUT /api/products/:id` - Actualizar producto (ADMIN)
- `DELETE /api/products/:id` - Eliminar producto (ADMIN)

### Ventas

- `GET /api/sales` - Listar todas las ventas
- `GET /api/sales/:id` - Obtener una venta
- `POST /api/sales` - Crear venta (procesar checkout)
- `DELETE /api/sales/:id` - Eliminar venta (ADMIN)
- `DELETE /api/sales` - Limpiar historial (ADMIN)

### Configuración

- `GET /api/settings` - Obtener todas las configuraciones
- `GET /api/settings/:key` - Obtener una configuración
- `PUT /api/settings/:key` - Actualizar configuración (ADMIN)

## 🔒 Roles y Permisos

### ADMIN
- Acceso completo a todas las funciones
- Puede crear, editar y eliminar productos
- Puede ver reportes
- Puede modificar configuraciones
- Puede realizar y ver ventas

### CAJERO
- Puede realizar ventas
- Puede ver productos
- No puede modificar productos
- No puede acceder a reportes
- No puede modificar configuraciones

## 📁 Estructura del Proyecto

```
tienda-proyecto-zahir/
├── config/
│   └── database.js          # Configuración de MySQL
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── products.js          # Rutas de productos
│   ├── sales.js             # Rutas de ventas
│   └── settings.js          # Rutas de configuración
├── scripts/
│   └── init-db.js           # Script de inicialización de BD
├── js/
│   ├── login.js             # Lógica de login (frontend)
│   └── app_full.js          # Lógica principal (frontend)
├── css/
│   └── styles.css           # Estilos
├── img/                     # Imágenes
├── server.js                # Servidor Express principal
├── index.html               # Página principal
├── login.html               # Página de login
├── package.json             # Dependencias
├── .env.example             # Ejemplo de configuración
├── .gitignore              # Archivos ignorados por git
└── README.md               # Este archivo
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MySQL2** - Cliente MySQL
- **bcrypt** - Hash de contraseñas
- **express-session** - Manejo de sesiones
- **dotenv** - Variables de entorno
- **cors** - Cross-Origin Resource Sharing

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos
- **JavaScript** (Vanilla) - Lógica del cliente
- **Fetch API** - Comunicación con el backend

## 🔄 Migración desde LocalStorage

Este proyecto fue migrado desde una versión que usaba LocalStorage a una arquitectura con base de datos MySQL:

- ✅ Los usuarios ahora se almacenan con contraseñas hasheadas
- ✅ Los productos persisten en la base de datos
- ✅ Las ventas se registran permanentemente
- ✅ La configuración se guarda en la BD
- ✅ El carrito aún usa LocalStorage para mejor rendimiento

## 🐛 Solución de Problemas

### Error de conexión a la base de datos

1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `.env`
3. Asegúrate de que el puerto sea correcto

### No puedo iniciar sesión

1. Ejecuta `npm run init-db` nuevamente
2. Verifica que los usuarios se crearon correctamente en la BD

### El servidor no inicia

1. Verifica que el puerto 3000 esté disponible
2. Revisa los logs de error en la consola
3. Asegúrate de haber ejecutado `npm install`

## 📝 Notas de Desarrollo

- Las sesiones se mantienen por 24 horas
- El carrito de compras se almacena localmente por rendimiento
- Las imágenes del logo se guardan como base64 en la BD
- Se utiliza bcrypt para hashear contraseñas (10 rounds)

## 📄 Licencia

ISC

## 👥 Autores

- Sistema desarrollado para La Tiendita de Esther
