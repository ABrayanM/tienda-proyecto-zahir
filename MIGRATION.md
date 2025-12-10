# Guía de Migración

## Cambios Principales en la Arquitectura

### Antes (Sistema Antiguo)
- **Frontend**: HTML, CSS, JavaScript puro
- **Almacenamiento**: localStorage del navegador
- **Servidor**: Archivos estáticos (sin servidor)
- **Autenticación**: localStorage

### Ahora (Sistema Nuevo)
- **Backend**: Node.js + Express.js
- **Base de Datos**: MySQL
- **Frontend**: EJS + JavaScript
- **Autenticación**: Sesiones del servidor
- **API REST**: Endpoints para productos, ventas, reportes

## Estructura de Carpetas

```
tienda-proyecto-zahir/
├── database/              # Scripts de base de datos
│   └── schema.sql        # Schema y datos iniciales
├── public/               # Archivos estáticos (CSS, JS, imágenes)
│   ├── css/
│   ├── js/
│   └── img/
├── src/                  # Código fuente del servidor
│   ├── config/          # Configuración (DB)
│   ├── routes/          # Rutas de la API
│   └── views/           # Plantillas EJS
├── server.js            # Servidor principal
├── package.json         # Dependencias
└── .env                 # Variables de entorno
```

## Archivos del Sistema Anterior

Los siguientes archivos **ya no se usan** pero se mantienen para referencia:

- `index.html` → Reemplazado por `src/views/index.ejs`
- `login.html` → Reemplazado por `src/views/login.ejs`
- `js/app_full.js` → Reemplazado por `public/js/app.js`
- `js/login.js` → Lógica integrada en `login.ejs`
- `css/styles.css` → Copiado a `public/css/styles.css`
- `img/` → Copiado a `public/img/`

**Nota**: Puedes eliminar estos archivos si lo deseas, pero se mantienen para comparación.

## Diferencias Clave

### 1. Almacenamiento de Datos

**Antes:**
```javascript
// localStorage
localStorage.setItem('products_v2', JSON.stringify(products));
```

**Ahora:**
```javascript
// MySQL via API
await fetch('/api/products', {
  method: 'POST',
  body: JSON.stringify(product)
});
```

### 2. Autenticación

**Antes:**
```javascript
// localStorage
localStorage.setItem('sessionUser', JSON.stringify(user));
```

**Ahora:**
```javascript
// Sesión del servidor
req.session.user = user;
```

### 3. Rutas

**Antes:**
```
http://localhost/index.html
http://localhost/login.html
```

**Ahora:**
```
http://localhost:3000/
http://localhost:3000/login
```

## API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/check` - Verificar sesión

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto (Admin)
- `PUT /api/products/:id` - Actualizar producto (Admin)
- `DELETE /api/products/:id` - Eliminar producto (Admin)

### Ventas
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `DELETE /api/sales/:id` - Eliminar venta (Admin)
- `GET /api/sales/reports/summary` - Reportes (Admin)

### Configuración
- `GET /api/settings/:key` - Obtener configuración (Admin)
- `POST /api/settings/:key` - Guardar configuración (Admin)
- `POST /api/settings/reset/all` - Reiniciar datos (Admin)

## Ventajas del Nuevo Sistema

### ✅ Persistencia Real
- Los datos se guardan en MySQL, no en el navegador
- Los datos no se pierden al limpiar el navegador
- Acceso desde múltiples dispositivos

### ✅ Seguridad Mejorada
- Autenticación del lado del servidor
- Sesiones seguras
- Control de acceso por roles (Admin/Cajero)

### ✅ Escalabilidad
- Arquitectura modular
- Fácil agregar nuevas funcionalidades
- Separación frontend/backend

### ✅ Profesional
- Usa tecnologías estándar de la industria
- Fácil de desplegar en servidores
- Base para futuras mejoras

## Funcionalidades Mantenidas

Todas las funcionalidades del sistema anterior se mantienen:

- ✅ Gestión de productos (CRUD)
- ✅ Sistema de carrito de compras
- ✅ Registro de ventas
- ✅ Historial de ventas
- ✅ Reportes y estadísticas
- ✅ Configuración del sistema
- ✅ Control por roles
- ✅ Interfaz de usuario idéntica

## Datos de Prueba

El sistema nuevo incluye datos de prueba similares a los del sistema anterior:

### Usuarios
- zahir / programador (ADMIN)
- brayan / cajero (ADMIN)
- cajero / 1234 (CAJERO)

### Productos de Ejemplo
- Arroz 1kg - S/ 9.50
- Azúcar 1kg - S/ 4.20
- Aceite 1L - S/ 12.00
- Leche 1L - S/ 3.80
- Fideos 500g - S/ 2.50
- Pollo entero - S/ 18.00
- Pan - S/ 1.20
- Café 250g - S/ 8.75

## Próximos Pasos Recomendados

1. **Seguridad**: Implementar bcrypt para encriptar contraseñas
2. **Validación**: Agregar validación de datos en el backend
3. **Imágenes**: Sistema para subir imágenes de productos
4. **Backup**: Sistema automático de respaldo
5. **Reportes**: Más opciones de reportes y gráficos
6. **Notificaciones**: Alertas de stock bajo
7. **Multi-tienda**: Soporte para múltiples sucursales

## Soporte

Si tienes preguntas sobre la migración, consulta:
- README.md - Documentación general
- SETUP_GUIDE.md - Guía de instalación paso a paso
- database/schema.sql - Estructura de la base de datos

---

**¡Bienvenido al nuevo sistema!** 🚀
