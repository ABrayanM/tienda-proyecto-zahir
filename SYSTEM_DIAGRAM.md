# Diagrama del Sistema de Gestión de Stock

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (HTML/JS)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Productos   │  │ Gestión de   │  │    Ventas    │         │
│  │   (Vista)    │  │    Stock     │  │   (Vista)    │         │
│  │              │  │   (Nueva)    │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │ API REST        │ API REST        │ API REST
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  /products   │  │/stock-       │  │   /sales     │         │
│  │   (Route)    │  │ movements    │  │   (Route)    │         │
│  │              │  │   (Nuevo)    │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS (MySQL)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   products   │  │stock_        │  │    sales     │         │
│  │              │◄─┤ movements    │  │              │         │
│  │ id           │  │  (Nueva)     │  │ id           │         │
│  │ name         │  │              │  │ date         │         │
│  │ price        │  │ id           │  │ total        │         │
│  │ stock*       │  │ product_id ──┼──► user_id      │         │
│  └──────────────┘  │ movement_type│  └──────┬───────┘         │
│                    │ quantity     │         │                  │
│                    │ reason       │  ┌──────▼───────┐         │
│                    │ user_id      │  │  sale_items  │         │
│                    │ created_at   │  │              │         │
│                    └──────────────┘  │ product_id   │         │
│                                      │ qty          │         │
│  * stock calculado desde movements   └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos: Venta

```
Usuario en Frontend
       │
       │ 1. Agregar productos al carrito
       ▼
[Vista Productos]
       │
       │ 2. Procesar venta
       ▼
POST /api/sales
       │
       │ 3. Iniciar transacción
       ▼
┌──────────────────────────────────────┐
│   Backend: routes/sales.js           │
│                                      │
│   ┌──────────────────────────────┐  │
│   │ 1. Validar stock disponible  │  │
│   │    (calcular desde movements)│  │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 2. Crear registro de venta   │  │
│   │    INSERT INTO sales         │  │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 3. Crear items de venta      │  │
│   │    INSERT INTO sale_items    │  │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 4. Crear movimientos EGRESO  │◄─┼─ NUEVO
│   │    INSERT INTO stock_movements│ │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 5. Actualizar products.stock │  │
│   │    UPDATE products           │  │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 6. COMMIT transacción        │  │
│   └──────────────────────────────┘  │
└──────────────────────────────────────┘
       │
       │ 7. Retornar venta creada
       ▼
Frontend actualiza vista
```

## Flujo de Datos: Ingreso Manual

```
Admin en Frontend
       │
       │ 1. Ir a "Gestión de Stock"
       ▼
[Vista Stock Management]
       │
       │ 2. Llenar formulario
       │    - Producto: Arroz
       │    - Tipo: INGRESO
       │    - Cantidad: 50
       │    - Motivo: "Compra proveedor"
       ▼
POST /api/stock-movements
       │
       │ 3. Iniciar transacción
       ▼
┌──────────────────────────────────────┐
│ Backend: routes/stock-movements.js   │
│                                      │
│   ┌──────────────────────────────┐  │
│   │ 1. Validar datos             │  │
│   │    - producto existe         │  │
│   │    - cantidad > 0            │  │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 2. Crear movimiento          │  │
│   │    INSERT INTO stock_movements│ │
│   │    - product_id: 1          │  │
│   │    - type: INGRESO          │  │
│   │    - quantity: 50           │  │
│   │    - reason: "Compra..."    │  │
│   │    - user_id: admin_id      │  │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 3. Actualizar products.stock │  │
│   │    UPDATE products           │  │
│   │    SET stock = stock + 50    │  │
│   └────────┬─────────────────────┘  │
│            ▼                         │
│   ┌──────────────────────────────┐  │
│   │ 4. COMMIT transacción        │  │
│   └──────────────────────────────┘  │
└──────────────────────────────────────┘
       │
       │ 5. Retornar movimiento creado
       ▼
Frontend actualiza:
  - Historial de movimientos
  - Resumen de stock
```

## Cálculo de Stock Actual

```sql
SELECT 
  p.id,
  p.name,
  p.price,
  COALESCE(
    SUM(
      CASE 
        WHEN sm.movement_type = 'INGRESO' THEN sm.quantity
        WHEN sm.movement_type = 'EGRESO'  THEN -sm.quantity
        ELSE 0
      END
    ), 
    0
  ) as stock
FROM products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id
GROUP BY p.id, p.name, p.price
```

Ejemplo con Producto "Arroz" (id=1):
```
┌─────────────────────────────────────────────┐
│ stock_movements para product_id = 1        │
├─────┬──────────────┬──────────┬────────────┤
│ id  │ movement_type│ quantity │  reason    │
├─────┼──────────────┼──────────┼────────────┤
│  1  │ INGRESO      │   50     │ Inicial    │
│  8  │ EGRESO       │    2     │ Venta #5   │
│ 15  │ INGRESO      │   30     │ Compra     │
│ 22  │ EGRESO       │    1     │ Venta #8   │
│ 28  │ EGRESO       │    2     │ Venta #10  │
└─────┴──────────────┴──────────┴────────────┘

Cálculo:
  Ingresos: 50 + 30 = 80
  Egresos:  2 + 1 + 2 = 5
  Stock Actual: 80 - 5 = 75 ✓
```

## Roles y Permisos

```
┌─────────────────────────────────────────────────────────┐
│                        ADMIN                            │
├─────────────────────────────────────────────────────────┤
│ ✅ Ver productos con stock                             │
│ ✅ Crear/editar/eliminar productos                     │
│ ✅ Ver "Gestión de Stock"                              │
│ ✅ Registrar movimientos (INGRESO/EGRESO)              │
│ ✅ Ver historial de movimientos                        │
│ ✅ Ver resumen de stock                                │
│ ✅ Realizar ventas                                     │
│ ✅ Ver reportes                                        │
│ ✅ Modificar configuración                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                       CAJERO                            │
├─────────────────────────────────────────────────────────┤
│ ✅ Ver productos con stock (solo lectura)              │
│ ❌ Crear/editar/eliminar productos                     │
│ ❌ Ver "Gestión de Stock"                              │
│ ❌ Registrar movimientos manuales                      │
│ ❌ Ver historial de movimientos                        │
│ ❌ Ver resumen de stock                                │
│ ✅ Realizar ventas (crea EGRESOS automáticos)          │
│ ❌ Ver reportes                                        │
│ ❌ Modificar configuración                             │
└─────────────────────────────────────────────────────────┘
```

## Tipos de Movimientos

```
┌────────────────────────────────────────────────────────┐
│                      INGRESO                           │
│               (Aumenta el stock)                       │
├────────────────────────────────────────────────────────┤
│ • Compra a proveedores                                │
│ • Devolución de clientes                              │
│ • Ajuste positivo de inventario                       │
│ • Stock inicial de productos nuevos                   │
│                                                        │
│ Registro: MANUAL por administrador                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      EGRESO                            │
│              (Disminuye el stock)                      │
├────────────────────────────────────────────────────────┤
│ • Ventas (AUTOMÁTICO)                                 │
│ • Productos vencidos/dañados (manual)                 │
│ • Muestras gratis (manual)                            │
│ • Ajuste negativo de inventario (manual)              │
│                                                        │
│ Registro: AUTOMÁTICO en ventas o MANUAL por admin      │
└────────────────────────────────────────────────────────┘
```

## Índices de Base de Datos

```
stock_movements:
  ├─ PRIMARY KEY (id)
  ├─ INDEX idx_product_id (product_id)     ← Para filtrar por producto
  ├─ INDEX idx_movement_type (movement_type) ← Para filtrar INGRESO/EGRESO
  ├─ INDEX idx_created_at (created_at)     ← Para filtrar por fecha
  └─ FOREIGN KEY (product_id) REFERENCES products(id)

Optimiza queries como:
  • WHERE product_id = ?
  • WHERE movement_type = 'INGRESO'
  • WHERE created_at BETWEEN ? AND ?
```

## API Endpoints

```
Autenticación:
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/session

Productos:
  GET    /api/products              ← Stock calculado desde movements
  GET    /api/products/:id          ← Stock calculado desde movements
  POST   /api/products              ← Crea movimiento INGRESO inicial
  PUT    /api/products/:id          ← Solo nombre/categoría/precio
  DELETE /api/products/:id

Stock Movements (NUEVO):
  GET    /api/stock-movements                    ← Con filtros
  GET    /api/stock-movements/product/:id        ← Por producto
  GET    /api/stock-movements/current-stock      ← Stock actual
  GET    /api/stock-movements/summary            ← Estadísticas
  POST   /api/stock-movements                    ← Crear movimiento

Ventas:
  GET    /api/sales
  GET    /api/sales/:id
  POST   /api/sales                 ← Crea movimientos EGRESO
  DELETE /api/sales/:id

Configuración:
  GET    /api/settings
  PUT    /api/settings/:key
```

## Archivos del Proyecto

```
tienda-proyecto-zahir/
├── Backend
│   ├── server.js                      (modificado)
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js               (modificado)
│   │   ├── sales.js                  (modificado)
│   │   ├── settings.js
│   │   └── stock-movements.js        (NUEVO)
│   └── scripts/
│       └── init-db.js                (modificado)
│
├── Frontend
│   ├── index.html                    (modificado)
│   ├── login.html
│   ├── css/
│   │   └── styles.css                (modificado)
│   └── js/
│       ├── app_full.js               (modificado - nueva vista)
│       └── login.js
│
└── Documentación
    ├── README.md                     (actualizado)
    ├── API.md                        (actualizado)
    ├── SECURITY.md
    ├── MIGRATION.md
    ├── STOCK_MANAGEMENT.md           (NUEVO - guía de usuario)
    ├── IMPLEMENTATION_SUMMARY.md     (NUEVO - resumen técnico)
    └── SYSTEM_DIAGRAM.md             (NUEVO - este archivo)
```

## Transacciones

Las operaciones críticas usan transacciones SQL para garantizar consistencia:

```javascript
// Ejemplo: Crear venta
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // 1. Validar stock
  // 2. Crear venta
  // 3. Crear items
  // 4. Crear movimientos EGRESO
  // 5. Actualizar products.stock
  
  await connection.commit(); // ✅ Todo exitoso
  
} catch (error) {
  await connection.rollback(); // ❌ Revertir todo
  throw error;
} finally {
  connection.release();
}
```

Garantiza que:
- O se completan TODAS las operaciones
- O NO se completa NINGUNA
- No hay estados inconsistentes
