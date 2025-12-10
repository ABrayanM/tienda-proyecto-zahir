# Checklist de Verificación de Instalación

Usa esta lista para verificar que tu instalación esté completa y funcionando correctamente.

## ✅ Pre-requisitos

- [ ] Node.js instalado (v14+)
  ```bash
  node --version
  ```
- [ ] MySQL instalado (v5.7+)
  ```bash
  mysql --version
  ```
- [ ] npm disponible
  ```bash
  npm --version
  ```

## ✅ Instalación de Dependencias

- [ ] Dependencias npm instaladas
  ```bash
  npm install
  # Debe mostrar: "added 128 packages" (aproximadamente)
  ```

## ✅ Configuración de Base de Datos

- [ ] MySQL servidor corriendo
  ```bash
  # Windows: Verificar en Servicios
  # Linux: sudo service mysql status
  # macOS: brew services list | grep mysql
  ```

- [ ] Base de datos creada
  ```bash
  mysql -u root -p < database/schema.sql
  # Debe ejecutar sin errores
  ```

- [ ] Verificar que la base de datos existe
  ```sql
  mysql -u root -p
  SHOW DATABASES;
  # Debe aparecer: tienda_zahir
  ```

- [ ] Verificar que las tablas existen
  ```sql
  USE tienda_zahir;
  SHOW TABLES;
  # Debe mostrar: users, products, sales, sale_items, settings
  ```

- [ ] Verificar datos de prueba
  ```sql
  SELECT username, role FROM users;
  # Debe mostrar: zahir, brayan, cajero
  
  SELECT COUNT(*) FROM products;
  # Debe mostrar: 8 productos
  ```

## ✅ Configuración de Entorno

- [ ] Archivo .env creado
  ```bash
  ls -la .env
  # Debe existir el archivo
  ```

- [ ] Variables configuradas correctamente
  ```bash
  cat .env
  # Verificar: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
  ```

## ✅ Estructura de Archivos

- [ ] Estructura de carpetas completa
  ```bash
  ls -la
  # Debe tener: database/, public/, src/, server.js, package.json
  ```

- [ ] Archivos estáticos en public/
  ```bash
  ls -R public/
  # Debe tener: css/styles.css, js/app.js, img/logo.png
  ```

- [ ] Vistas en src/views/
  ```bash
  ls src/views/
  # Debe tener: index.ejs, login.ejs
  ```

- [ ] Rutas en src/routes/
  ```bash
  ls src/routes/
  # Debe tener: auth.js, products.js, sales.js, settings.js
  ```

## ✅ Inicio del Servidor

- [ ] Servidor inicia sin errores
  ```bash
  npm start
  # O: npm run dev (para desarrollo)
  ```

- [ ] Conexión a MySQL exitosa
  ```
  # Debe mostrar en consola:
  ✓ Conectado a la base de datos MySQL
  ✓ Servidor corriendo en http://localhost:3000
  ```

- [ ] Puerto 3000 disponible
  ```bash
  # Si está ocupado, cambiar en .env:
  PORT=3001
  ```

## ✅ Pruebas de Funcionalidad

### Login
- [ ] Página de login carga
  - Navegar a: http://localhost:3000/login
  - Debe mostrar formulario de login

- [ ] Login con usuario válido funciona
  - Usuario: `zahir`
  - Contraseña: `programador`
  - Debe redirigir a página principal

- [ ] Login con credenciales incorrectas falla
  - Debe mostrar mensaje de error

### Panel Principal
- [ ] Dashboard carga correctamente
  - Debe mostrar sidebar con menú
  - Debe mostrar "Bienvenido, ZAHIR"

- [ ] Menú de navegación funciona
  - Productos ✓
  - Ventas ✓
  - Reportes ✓ (solo Admin)
  - Configuración ✓ (solo Admin)

### Productos
- [ ] Lista de productos se muestra
  - Debe mostrar 8 productos iniciales
  - Arroz, Azúcar, Aceite, etc.

- [ ] Buscar productos funciona
  - Escribir "Arroz" en buscador
  - Debe filtrar resultados

- [ ] Crear producto (Admin)
  - Click en "➕ Nuevo Producto"
  - Llenar formulario
  - Guardar
  - Debe aparecer en lista

- [ ] Editar producto (Admin)
  - Click en botón ✏️
  - Modificar datos
  - Guardar
  - Debe actualizarse

- [ ] Eliminar producto (Admin)
  - Click en botón 🗑️
  - Confirmar
  - Debe desaparecer de lista

### Carrito y Ventas
- [ ] Agregar producto al carrito
  - Seleccionar cantidad
  - Click en "➕ Añadir"
  - Debe agregarse al carrito

- [ ] Ver carrito
  - Click en "🛒 Ver Carrito"
  - Debe mostrar items agregados
  - Debe mostrar total

- [ ] Procesar venta
  - Agregar productos al carrito
  - Click en "Procesar Venta"
  - Debe registrar venta
  - Stock debe disminuir

### Historial de Ventas
- [ ] Ver ventas registradas
  - Click en menú "Ventas"
  - Debe mostrar lista de ventas
  - Debe mostrar fecha, items, total

- [ ] Exportar ventas (CSV)
  - Click en "⬇ Exportar Ventas"
  - Debe descargar archivo CSV

### Reportes (Admin)
- [ ] Generar reportes
  - Click en menú "Reportes"
  - Seleccionar período
  - Click en "Generar Reporte"
  - Debe mostrar ingresos totales
  - Debe mostrar productos más vendidos

- [ ] Exportar reporte
  - Click en "⬇ Exportar CSV"
  - Debe descargar reporte

### Configuración (Admin)
- [ ] Cambiar logo
  - Click en menú "Configuración"
  - Subir nueva imagen
  - Debe actualizarse en sidebar

### Sesión
- [ ] Cerrar sesión funciona
  - Click en "Cerrar sesión"
  - Debe redirigir a login
  - Intentar acceder a / debe redirigir a login

### Roles
- [ ] Usuario Cajero tiene restricciones
  - Login como: `cajero` / `1234`
  - NO debe ver "Reportes" en menú
  - NO debe ver "Configuración" en menú
  - NO debe poder editar/eliminar productos
  - SÍ puede hacer ventas

## ✅ Verificación de Seguridad Básica

- [ ] Intentar acceder sin login
  - Ir a: http://localhost:3000/
  - Debe redirigir a /login

- [ ] Session expira correctamente
  - Login
  - Cerrar navegador
  - Abrir y navegar a /
  - Debe pedir login nuevamente

## 🎉 Instalación Completa

Si todos los checkboxes están marcados, ¡tu instalación está completa!

## 🐛 Si algo no funciona

1. Revisa la consola del servidor para errores
2. Revisa la consola del navegador (F12) para errores JavaScript
3. Verifica las credenciales de MySQL en `.env`
4. Consulta `README.md` y `SETUP_GUIDE.md`
5. Verifica que MySQL esté corriendo
6. Verifica que el puerto 3000 no esté ocupado

## 📝 Próximos Pasos

Una vez verificada la instalación:

1. Cambiar contraseñas por defecto
2. Agregar tus propios productos
3. Configurar logo de tu tienda
4. Empezar a usar el sistema

¡Éxito! 🚀
