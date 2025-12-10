# Arquitectura del Sistema

## Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Login View │  │ Index View │  │   CSS      │            │
│  │ (login.ejs)│  │ (index.ejs)│  │ (styles)   │            │
│  └─────┬──────┘  └─────┬──────┘  └────────────┘            │
│        │                │                                     │
│        └────────┬───────┘                                     │
│                 │                                             │
│        ┌────────▼─────────┐                                  │
│        │   JavaScript     │                                  │
│        │   (app.js)       │                                  │
│        └────────┬─────────┘                                  │
└─────────────────┼─────────────────────────────────────────────┘
                  │ HTTP/FETCH
                  │
┌─────────────────▼─────────────────────────────────────────────┐
│                   SERVIDOR NODE.JS                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                    server.js                         │    │
│  │  - Express App                                        │    │
│  │  - Session Management                                 │    │
│  │  - Static Files                                       │    │
│  │  - View Engine (EJS)                                  │    │
│  └────────┬──────────────────────────┬────────────────────┘    │
│           │                          │                         │
│  ┌────────▼─────────┐       ┌────────▼─────────┐             │
│  │   MIDDLEWARE     │       │     ROUTES        │             │
│  │  - express.json()│       │  /auth/*          │             │
│  │  - sessions      │       │  /api/products/*  │             │
│  │  - static        │       │  /api/sales/*     │             │
│  └──────────────────┘       │  /api/settings/*  │             │
│                             └────────┬───────────┘             │
│                                      │                         │
│                             ┌────────▼───────────┐             │
│                             │  AUTHENTICATION    │             │
│                             │  & AUTHORIZATION   │             │
│                             │  - requireAuth     │             │
│                             │  - requireAdmin    │             │
│                             └────────┬───────────┘             │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                            ┌──────────▼──────────┐
                            │    db.js (Config)   │
                            │  - MySQL Pool       │
                            │  - Promises         │
                            └──────────┬──────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────┐
│                      BASE DE DATOS MYSQL                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐  │
│  │   users   │  │ products  │  │   sales   │  │ settings │  │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘  │
│                                  ┌───────────┐                │
│                                  │sale_items │                │
│                                  └───────────┘                │
└───────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Autenticación
```
Usuario → Login Form → POST /auth/login → Validar en DB → Crear Sesión → Redirigir
```

### 2. Ver Productos
```
Usuario → Click "Productos" → GET /api/products → Query MySQL → Devolver JSON → Renderizar
```

### 3. Crear Producto (Admin)
```
Admin → Llenar Formulario → POST /api/products → Validar Rol → INSERT en DB → Respuesta
```

### 4. Realizar Venta
```
Usuario → Agregar al Carrito (Frontend) → Click "Procesar Venta" → 
POST /api/sales → BEGIN TRANSACTION → 
INSERT sale → INSERT sale_items → UPDATE stock → 
COMMIT → Respuesta
```

### 5. Ver Reportes (Admin)
```
Admin → Seleccionar Período → GET /api/sales/reports/summary?period=month →
Query Agregado en MySQL → Calcular Totales → Devolver JSON → Renderizar
```

## Componentes del Sistema

### Frontend (Cliente)
- **Views (EJS)**: Plantillas HTML dinámicas
  - `login.ejs`: Página de autenticación
  - `index.ejs`: Panel principal
- **JavaScript**: Lógica del cliente
  - `app.js`: Manejo de UI, llamadas API, renderizado dinámico
- **CSS**: Estilos
  - `styles.css`: Diseño visual del sistema

### Backend (Servidor)
- **server.js**: Punto de entrada, configuración Express
- **Routes**: Manejadores de endpoints
  - `auth.js`: Login, logout, verificación
  - `products.js`: CRUD de productos
  - `sales.js`: Registro de ventas, reportes
  - `settings.js`: Configuración del sistema
- **Config**: Configuración
  - `db.js`: Pool de conexiones MySQL

### Base de Datos (MySQL)
- **Tablas Principales**:
  - `users`: Usuarios del sistema
  - `products`: Inventario
  - `sales`: Cabecera de ventas
  - `sale_items`: Detalle de ventas
  - `settings`: Configuración

## Seguridad

```
┌─────────────────────────────────────┐
│         CAPA DE SEGURIDAD           │
├─────────────────────────────────────┤
│ 1. Session Management               │
│    - express-session                │
│    - Cookies HTTP-only              │
├─────────────────────────────────────┤
│ 2. Authentication                   │
│    - POST /auth/login               │
│    - Verificación de credenciales   │
├─────────────────────────────────────┤
│ 3. Authorization                    │
│    - requireAuth middleware         │
│    - requireAdmin middleware        │
│    - Role-based access control      │
├─────────────────────────────────────┤
│ 4. Database                         │
│    - Parameterized queries          │
│    - Protection against SQL injection│
├─────────────────────────────────────┤
│ 5. Environment Variables            │
│    - .env file                      │
│    - Sensitive data protection      │
└─────────────────────────────────────┘
```

## Roles y Permisos

```
┌──────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                      │
├──────────────────────────────────────────────────────┤
│ ✅ Ver productos                                     │
│ ✅ Crear productos                                   │
│ ✅ Editar productos                                  │
│ ✅ Eliminar productos                                │
│ ✅ Realizar ventas                                   │
│ ✅ Ver historial de ventas                           │
│ ✅ Eliminar ventas                                   │
│ ✅ Ver reportes                                      │
│ ✅ Acceder a configuración                           │
│ ✅ Cambiar logo                                      │
│ ✅ Reiniciar sistema                                 │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                       CAJERO                          │
├──────────────────────────────────────────────────────┤
│ ✅ Ver productos                                     │
│ ❌ Crear productos                                   │
│ ❌ Editar productos                                  │
│ ❌ Eliminar productos                                │
│ ✅ Realizar ventas                                   │
│ ✅ Ver historial de ventas                           │
│ ❌ Eliminar ventas                                   │
│ ❌ Ver reportes                                      │
│ ❌ Acceder a configuración                           │
└──────────────────────────────────────────────────────┘
```

## API Endpoints

### Autenticación
```
POST   /auth/login      - Iniciar sesión
POST   /auth/logout     - Cerrar sesión
GET    /auth/check      - Verificar sesión activa
```

### Productos
```
GET    /api/products           - Listar todos [Auth]
GET    /api/products/:id       - Obtener uno [Auth]
POST   /api/products           - Crear [Admin]
PUT    /api/products/:id       - Actualizar [Admin]
DELETE /api/products/:id       - Eliminar [Admin]
```

### Ventas
```
GET    /api/sales                    - Listar ventas [Auth]
POST   /api/sales                    - Crear venta [Auth]
DELETE /api/sales/:id                - Eliminar venta [Admin]
GET    /api/sales/reports/summary    - Reportes [Admin]
```

### Configuración
```
GET    /api/settings/:key       - Obtener configuración [Admin]
POST   /api/settings/:key       - Guardar configuración [Admin]
POST   /api/settings/reset/all  - Reiniciar datos [Admin]
```

## Tecnologías Utilizadas

```
┌─────────────────────────────────────┐
│            BACKEND                  │
├─────────────────────────────────────┤
│ • Node.js        (Runtime)          │
│ • Express.js     (Web Framework)    │
│ • MySQL2         (Database Driver)  │
│ • EJS            (Template Engine)  │
│ • express-session (Session Management)│
│ • dotenv         (Environment Vars) │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│           FRONTEND                  │
├─────────────────────────────────────┤
│ • HTML5          (Structure)        │
│ • CSS3           (Styling)          │
│ • JavaScript ES6 (Logic)            │
│ • Fetch API      (HTTP Requests)    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│           DATABASE                  │
├─────────────────────────────────────┤
│ • MySQL 5.7+     (RDBMS)            │
│ • InnoDB         (Storage Engine)   │
└─────────────────────────────────────┘
```

## Flujo de Inicio de Sesión

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│ Usuario │────▶│ Browser │────▶│  Server  │────▶│  MySQL  │
└─────────┘     └─────────┘     └──────────┘     └─────────┘
     │               │                │                 │
     │ 1. Ingresa    │                │                 │
     │ credenciales  │                │                 │
     │──────────────▶│                │                 │
     │               │ 2. POST        │                 │
     │               │ /auth/login    │                 │
     │               │───────────────▶│                 │
     │               │                │ 3. SELECT user  │
     │               │                │────────────────▶│
     │               │                │◀────────────────│
     │               │                │ 4. Validar      │
     │               │                │    password     │
     │               │                │                 │
     │               │◀───────────────│ 5. Crear sesión │
     │               │    Set-Cookie  │                 │
     │◀──────────────│                │                 │
     │ 6. Redirigir  │                │                 │
     │    a /        │                │                 │
```

## Estructura de Sesión

```javascript
req.session.user = {
  id: 1,
  username: "zahir",
  role: "ADMIN"
}
```

## Variables de Entorno

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=********
DB_NAME=tienda_zahir
DB_PORT=3306

# Seguridad
SESSION_SECRET=****************
```

---

Esta arquitectura proporciona una base sólida, escalable y mantenible para el sistema de gestión de la tienda de abarrotes.
