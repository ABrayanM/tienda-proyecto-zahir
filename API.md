# API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All endpoints except `/auth/login` require an active session.

### POST /auth/login

Login with username and password.

**Request Body:**
```json
{
  "username": "zahir",
  "password": "programador"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "username": "zahir",
    "role": "ADMIN"
  }
}
```

### POST /auth/logout

Logout current user.

**Response:**
```json
{
  "success": true
}
```

### GET /auth/session

Check if there's an active session.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "zahir",
    "role": "ADMIN"
  }
}
```

## Products

### GET /products

Get all products.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Arroz 1kg",
    "category": "Granos",
    "price": 9.50,
    "stock": 50,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

### GET /products/:id

Get a single product by ID.

**Response:**
```json
{
  "id": 1,
  "name": "Arroz 1kg",
  "category": "Granos",
  "price": 9.50,
  "stock": 50,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### POST /products

Create a new product. **Requires ADMIN role.** If initial stock is provided, a stock movement (INGRESO) is automatically created.

**Request Body:**
```json
{
  "name": "Café molido 250g",
  "category": "Bebidas",
  "price": 8.75,
  "stock": 25
}
```

**Response:**
```json
{
  "id": 9,
  "name": "Café molido 250g",
  "category": "Bebidas",
  "price": 8.75,
  "stock": 25,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### PUT /products/:id

Update a product. **Requires ADMIN role.** Note: Stock cannot be updated directly; use stock movements instead.

**Request Body:**
```json
{
  "name": "Café molido premium 250g",
  "category": "Bebidas",
  "price": 10.00
}
```

**Response:**
```json
{
  "id": 9,
  "name": "Café molido premium 250g",
  "category": "Bebidas",
  "price": 10.00,
  "stock": 30,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T12:00:00.000Z"
}
```

### DELETE /products/:id

Delete a product. **Requires ADMIN role.**

**Response:**
```json
{
  "success": true,
  "message": "Product deleted"
}
```

## Sales

### GET /sales

Get all sales with their items.

**Response:**
```json
[
  {
    "id": 1,
    "date": "2025-01-01T10:30:00.000Z",
    "total": 25.50,
    "user_id": 1,
    "username": "zahir",
    "created_at": "2025-01-01T10:30:00.000Z",
    "items": [
      {
        "id": 1,
        "sale_id": 1,
        "product_id": 1,
        "product_name": "Arroz 1kg",
        "price": 9.50,
        "qty": 2
      },
      {
        "id": 2,
        "sale_id": 1,
        "product_id": 4,
        "product_name": "Leche 1L",
        "price": 3.80,
        "qty": 2
      }
    ]
  }
]
```

### GET /sales/:id

Get a single sale by ID.

**Response:**
```json
{
  "id": 1,
  "date": "2025-01-01T10:30:00.000Z",
  "total": 25.50,
  "user_id": 1,
  "username": "zahir",
  "created_at": "2025-01-01T10:30:00.000Z",
  "items": [...]
}
```

### POST /sales

Create a new sale (process checkout). Automatically creates stock movements (EGRESO) for each item.

**Request Body:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Arroz 1kg",
      "price": 9.50,
      "qty": 2
    },
    {
      "id": 4,
      "name": "Leche 1L",
      "price": 3.80,
      "qty": 2
    }
  ],
  "total": 26.60
}
```

**Response:**
```json
{
  "id": 2,
  "date": "2025-01-01T11:00:00.000Z",
  "total": 26.60,
  "user_id": 1,
  "created_at": "2025-01-01T11:00:00.000Z",
  "items": [...]
}
```

### DELETE /sales/:id

Delete a sale. **Requires ADMIN role.**

**Response:**
```json
{
  "success": true,
  "message": "Sale deleted"
}
```

### DELETE /sales

Clear all sales history. **Requires ADMIN role.**

**Response:**
```json
{
  "success": true,
  "message": "All sales cleared"
}
```

## Stock Movements

### GET /stock-movements

Get all stock movements with optional filters.

**Query Parameters:**
- `product_id` (optional): Filter by product ID
- `movement_type` (optional): Filter by type (INGRESO or EGRESO)
- `start_date` (optional): Filter by start date (ISO format)
- `end_date` (optional): Filter by end date (ISO format)
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Arroz 1kg",
    "movement_type": "INGRESO",
    "quantity": 50,
    "reason": "Inventario inicial",
    "reference_type": null,
    "reference_id": null,
    "user_id": 1,
    "username": "zahir",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

### GET /stock-movements/product/:productId

Get stock movements for a specific product.

**Response:**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "movement_type": "INGRESO",
    "quantity": 50,
    "reason": "Inventario inicial",
    "reference_type": null,
    "reference_id": null,
    "user_id": 1,
    "username": "zahir",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

### GET /stock-movements/current-stock

Get current stock for all products calculated from movements.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Arroz 1kg",
    "category": "Granos",
    "price": 9.50,
    "stock": 48
  }
]
```

### GET /stock-movements/summary

Get stock summary statistics.

**Response:**
```json
{
  "total_movements": 25,
  "total_ingresos": 500,
  "total_egresos": 120,
  "current_total_stock": 380
}
```

### POST /stock-movements

Create a new stock movement. **Requires ADMIN role.**

**Request Body:**
```json
{
  "product_id": 1,
  "movement_type": "INGRESO",
  "quantity": 20,
  "reason": "Compra a proveedor"
}
```

**Response:**
```json
{
  "id": 15,
  "product_id": 1,
  "product_name": "Arroz 1kg",
  "movement_type": "INGRESO",
  "quantity": 20,
  "reason": "Compra a proveedor",
  "reference_type": null,
  "reference_id": null,
  "user_id": 1,
  "username": "zahir",
  "created_at": "2025-01-01T14:30:00.000Z"
}
```

## Settings

### GET /settings

Get all settings.

**Response:**
```json
{
  "logo": "/mnt/data/3fc39e9b-4ca9-4918-8387-6a814daa9f4a.png"
}
```

### GET /settings/:key

Get a specific setting by key.

**Response:**
```json
{
  "key": "logo",
  "value": "/mnt/data/3fc39e9b-4ca9-4918-8387-6a814daa9f4a.png"
}
```

### PUT /settings/:key

Update a setting. **Requires ADMIN role.**

**Request Body:**
```json
{
  "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhE..."
}
```

**Response:**
```json
{
  "success": true,
  "key": "logo",
  "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhE..."
}
```

### DELETE /settings/:key

Delete a setting. **Requires ADMIN role.**

**Response:**
```json
{
  "success": true,
  "message": "Setting deleted"
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Descriptive error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Notes

- All endpoints use JSON for request and response bodies
- Sessions are maintained using cookies
- Session cookies expire after 24 hours
- Passwords are hashed using bcrypt
- Product stock is calculated from stock movements (INGRESO and EGRESO)
- Sales automatically create stock movements (EGRESO) for inventory tracking
- Stock movements provide a complete audit trail of all inventory changes
- Admins can manually create stock movements for adjustments and restocking
- Sale items reference products but store the product name to preserve history even if the product is deleted
