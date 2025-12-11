# Guía de Gestión de Stock

## Descripción General

El sistema de gestión de stock de la tienda registra todos los movimientos de inventario mediante una tabla dedicada `stock_movements`. Esto proporciona:

- **Trazabilidad completa**: Cada cambio en el inventario queda registrado
- **Auditoría**: Historial completo de ingresos y egresos
- **Integridad**: El stock actual siempre se calcula desde los movimientos
- **Transparencia**: Se sabe quién, cuándo y por qué cambió el inventario

## Tipos de Movimientos

### INGRESO
Movimientos que aumentan el stock disponible:
- Compras a proveedores
- Devoluciones de clientes
- Ajustes positivos de inventario
- Stock inicial de productos nuevos

### EGRESO
Movimientos que disminuyen el stock disponible:
- Ventas (automático)
- Productos dañados o vencidos
- Muestras o promociones
- Ajustes negativos de inventario

## Cómo Funciona

### Cálculo de Stock

El stock actual de cada producto se calcula mediante la fórmula:

```
Stock Actual = Σ(INGRESOS) - Σ(EGRESOS)
```

Por ejemplo, si un producto tiene:
- 100 unidades de ingreso inicial
- 50 unidades vendidas (egreso)
- 30 unidades de nueva compra (ingreso)
- Stock actual = 100 - 50 + 30 = 80 unidades

### Ventas y Stock

Cuando se realiza una venta:
1. El sistema verifica que hay suficiente stock disponible
2. Se crea el registro de venta
3. Se crean automáticamente movimientos de tipo EGRESO para cada producto vendido
4. El stock se actualiza instantáneamente

## Uso del Sistema

### Para Administradores

#### Registrar Ingreso de Stock

1. Ir al menú **"Gestión de Stock"**
2. Hacer clic en **"➕ Registrar Movimiento"**
3. Completar el formulario:
   - **Producto**: Seleccionar el producto
   - **Tipo de Movimiento**: INGRESO
   - **Cantidad**: Número de unidades a ingresar
   - **Motivo**: Ej: "Compra a proveedor", "Devolución cliente"
4. Hacer clic en **"Registrar"**

#### Registrar Egreso Manual

1. Ir al menú **"Gestión de Stock"**
2. Hacer clic en **"➕ Registrar Movimiento"**
3. Completar el formulario:
   - **Producto**: Seleccionar el producto
   - **Tipo de Movimiento**: EGRESO
   - **Cantidad**: Número de unidades a dar de baja
   - **Motivo**: Ej: "Producto vencido", "Muestra gratis", "Ajuste inventario"
4. Hacer clic en **"Registrar"**

#### Ver Historial de Movimientos

En la vista de **"Gestión de Stock"** puedes:
- Ver todos los movimientos registrados
- Filtrar por tipo (Ingresos/Egresos)
- Filtrar por producto específico
- Ver quién realizó cada movimiento
- Ver la fecha y hora exacta

#### Ver Resumen de Stock

El panel de resumen muestra:
- **Total Ingresos**: Suma de todas las unidades ingresadas
- **Total Egresos**: Suma de todas las unidades egresadas
- **Stock Total Actual**: Stock disponible en toda la tienda
- **Total Movimientos**: Número total de transacciones registradas

### Para Cajeros

Los cajeros tienen acceso limitado:
- ✅ Pueden ver productos y su stock disponible
- ✅ Pueden realizar ventas (que crean egresos automáticos)
- ❌ No pueden acceder al módulo de Gestión de Stock
- ❌ No pueden registrar movimientos manuales

## Casos de Uso Comunes

### Caso 1: Nueva Compra a Proveedor

**Situación**: Compró 50 unidades de "Arroz 1kg" a su proveedor.

**Pasos**:
1. Gestión de Stock → Registrar Movimiento
2. Producto: Arroz 1kg
3. Tipo: INGRESO
4. Cantidad: 50
5. Motivo: "Compra proveedor XYZ - Factura #123"

**Resultado**: El stock de Arroz aumenta en 50 unidades y queda registrado en el historial.

### Caso 2: Producto Vencido

**Situación**: Encontró 3 unidades de "Leche 1L" vencidas que debe dar de baja.

**Pasos**:
1. Gestión de Stock → Registrar Movimiento
2. Producto: Leche 1L
3. Tipo: EGRESO
4. Cantidad: 3
5. Motivo: "Producto vencido - fecha 10/12/2025"

**Resultado**: El stock de Leche disminuye en 3 unidades y se registra la razón.

### Caso 3: Ajuste de Inventario

**Situación**: Después de contar físicamente, encontró que hay 5 unidades menos de "Café 250g" de lo que indica el sistema.

**Pasos**:
1. Gestión de Stock → Registrar Movimiento
2. Producto: Café 250g
3. Tipo: EGRESO
4. Cantidad: 5
5. Motivo: "Ajuste por inventario físico"

**Resultado**: El stock se corrige y queda documentado el ajuste.

### Caso 4: Venta Normal

**Situación**: Un cliente compra 2 unidades de "Pan" y 1 de "Aceite 1L".

**Pasos**:
1. En la vista de Productos, agregar items al carrito
2. Procesar venta normalmente

**Resultado**: 
- Se registra la venta
- Se crean automáticamente 2 movimientos de EGRESO:
  - Pan: -2 unidades (referencia: venta #X)
  - Aceite: -1 unidad (referencia: venta #X)

## Validaciones del Sistema

### Validación de Stock Insuficiente

Si intenta:
- Realizar una venta sin stock suficiente
- Registrar un egreso mayor al stock disponible

El sistema mostrará un error indicando:
```
Insufficient stock. Available: X, Requested: Y
```

### Validación de Datos

El sistema valida:
- ✅ Cantidad debe ser mayor a 0
- ✅ Producto debe existir
- ✅ Tipo de movimiento debe ser INGRESO o EGRESO
- ✅ Usuario debe estar autenticado

## Reportes y Auditoría

### Información Registrada en Cada Movimiento

- **ID único**: Identificador del movimiento
- **Producto**: ID y nombre del producto
- **Tipo**: INGRESO o EGRESO
- **Cantidad**: Unidades movidas
- **Motivo**: Razón del movimiento
- **Referencia**: Tipo y ID (para ventas automáticas)
- **Usuario**: Quién realizó el movimiento
- **Fecha y Hora**: Timestamp exacto

### Consultas Útiles

El sistema permite consultar:
- Movimientos de un producto específico
- Movimientos por tipo (solo ingresos o solo egresos)
- Movimientos en un rango de fechas
- Stock actual calculado en tiempo real

## Mejores Prácticas

1. **Registrar todos los movimientos**: No modifique productos directamente, use movimientos
2. **Motivos descriptivos**: Sea específico en el campo "Motivo"
3. **Inventarios periódicos**: Compare stock físico vs sistema regularmente
4. **Ajustes documentados**: Si hace ajustes, indique por qué
5. **Revisar historial**: Use los filtros para auditar movimientos sospechosos

## Migración desde Sistema Anterior

Si viene de un sistema donde el stock se modificaba directamente:

**Antes**:
- Stock se guardaba como número en tabla products
- No había historial de cambios
- No se sabía quién o cuándo cambió el stock

**Ahora**:
- Stock se calcula desde movimientos
- Historial completo de todos los cambios
- Trazabilidad de usuario, fecha y motivo
- Las ventas crean movimientos automáticamente

## Soporte

Para problemas o dudas sobre el sistema de gestión de stock, contacte al administrador del sistema.

## Notas Técnicas

- Los movimientos no se pueden editar ni eliminar (integridad de auditoría)
- El campo `stock` en la tabla `products` se mantiene por compatibilidad pero se actualiza automáticamente
- Las consultas de stock usan índices para máximo rendimiento
- Los movimientos de venta incluyen `reference_type='sale'` y `reference_id` con el ID de la venta
