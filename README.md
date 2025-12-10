# Tienda de Abarrotes - Sistema de Gestión

Sistema de gestión para "La tiendita de Esther" - Una aplicación web moderna construida con Node.js, Express y MySQL para administrar inventario, ventas y reportes de una tienda de abarrotes.

## 🚀 Características

- **Gestión de Productos**: CRUD completo de productos con control de stock
- **Sistema de Ventas**: Carrito de compras y registro de ventas
- **Reportes**: Análisis de ventas y productos más vendidos
- **Control de Acceso**: Sistema de autenticación con roles (Admin y Cajero)
- **Interfaz Intuitiva**: Diseño moderno y responsivo

## 📋 Requisitos Previos

Antes de instalar, asegúrate de tener instalado:

- **Node.js** (versión 14 o superior) - [Descargar](https://nodejs.org/)
- **MySQL** (versión 5.7 o superior) - [Descargar](https://dev.mysql.com/downloads/)
- **npm** (incluido con Node.js)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/ABrayanM/tienda-proyecto-zahir.git
cd tienda-proyecto-zahir
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

#### Opción A: Usando MySQL Workbench o phpMyAdmin

1. Abre tu cliente MySQL favorito
2. Ejecuta el archivo `database/schema.sql` para crear la base de datos y tablas
3. El script creará automáticamente:
   - Base de datos `tienda_zahir`
   - Tablas necesarias (users, products, sales, sale_items, settings)
   - Usuarios de prueba
   - Productos de ejemplo

#### Opción B: Usando línea de comandos

```bash
mysql -u root -p < database/schema.sql
```

### 4. Configurar variables de entorno

1. Copia el archivo de ejemplo `.env.example` a `.env`:

```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus credenciales de MySQL:

```env
PORT=3000
NODE_ENV=development

# Configura estos valores según tu instalación de MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=tienda_zahir
DB_PORT=3306

SESSION_SECRET=cambia_esto_por_algo_secreto
```

## 🚀 Ejecutar la aplicación

### Modo desarrollo (con auto-reinicio)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

La aplicación estará disponible en: `http://localhost:3000`

## 👥 Usuarios de Prueba

El sistema viene con usuarios predefinidos para pruebas:

| Usuario | Contraseña   | Rol    |
|---------|--------------|--------|
| zahir   | programador  | ADMIN  |
| brayan  | cajero       | ADMIN  |
| cajero  | 1234         | CAJERO |

**Nota**: En producción, se recomienda cambiar estas contraseñas y usar encriptación (bcrypt).

## 📁 Estructura del Proyecto

```
tienda-proyecto-zahir/
├── database/
│   └── schema.sql          # Schema de base de datos MySQL
├── public/                 # Archivos estáticos
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js         # JavaScript del frontend
│   └── img/
│       └── logo.png
├── src/
│   ├── config/
│   │   └── db.js          # Configuración de conexión a MySQL
│   ├── routes/
│   │   ├── auth.js        # Rutas de autenticación
│   │   ├── products.js    # Rutas de productos
│   │   ├── sales.js       # Rutas de ventas
│   │   └── settings.js    # Rutas de configuración
│   └── views/
│       ├── index.ejs      # Vista principal
│       └── login.ejs      # Vista de login
├── .env.example           # Ejemplo de variables de entorno
├── .gitignore
├── package.json
├── server.js              # Servidor Express principal
└── README.md
```

## 🔐 Roles y Permisos

### Administrador (ADMIN)
- ✅ Crear, editar y eliminar productos
- ✅ Realizar ventas
- ✅ Ver historial de ventas
- ✅ Ver reportes y estadísticas
- ✅ Configurar el sistema
- ✅ Subir logo personalizado

### Cajero (CAJERO)
- ✅ Ver productos
- ✅ Realizar ventas
- ✅ Ver historial de ventas
- ❌ No puede modificar productos
- ❌ No puede acceder a reportes
- ❌ No puede cambiar configuración

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js**: Entorno de ejecución
- **Express.js**: Framework web
- **MySQL2**: Cliente de MySQL para Node.js
- **EJS**: Motor de plantillas
- **express-session**: Manejo de sesiones
- **dotenv**: Gestión de variables de entorno

### Frontend
- **HTML5/CSS3**: Estructura y estilos
- **JavaScript**: Lógica del cliente
- **Fetch API**: Comunicación con el backend

## 📊 Base de Datos

El sistema utiliza las siguientes tablas:

- **users**: Usuarios del sistema
- **products**: Inventario de productos
- **sales**: Registro de ventas
- **sale_items**: Detalles de items vendidos
- **settings**: Configuración del sistema

## 🐛 Solución de Problemas

### Error de conexión a MySQL

Si recibes un error de conexión:

1. Verifica que MySQL esté ejecutándose
2. Confirma las credenciales en el archivo `.env`
3. Asegúrate de que la base de datos `tienda_zahir` existe

### Puerto ya en uso

Si el puerto 3000 está ocupado:

1. Cambia el puerto en el archivo `.env`
2. O detén el proceso que usa el puerto 3000

### Módulos no encontrados

Si hay errores de módulos faltantes:

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🔄 Migración desde versión anterior

Si estás migrando desde la versión HTML estática:

1. Los datos anteriores en localStorage NO se migrarán automáticamente
2. Se creará una nueva base de datos con productos de ejemplo
3. Los estilos CSS se mantienen intactos
4. La funcionalidad es equivalente, ahora con persistencia en MySQL

## 📝 Notas de Seguridad

⚠️ **Importante para Producción**:

1. Cambia `SESSION_SECRET` por un valor aleatorio y seguro
2. Implementa encriptación de contraseñas con bcrypt
3. Usa HTTPS en producción
4. Configura límites de tasa (rate limiting)
5. Valida y sanitiza todas las entradas de usuario
6. No expongas credenciales en el código

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia ISC.

## 👨‍💻 Autor

Sistema desarrollado para "La tiendita de Esther"

## 📞 Soporte

Si tienes problemas o preguntas, por favor abre un issue en el repositorio de GitHub.

---

**¡Gracias por usar nuestro sistema de gestión!** 🛒✨
