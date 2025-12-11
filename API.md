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

Create a new product. **Requires ADMIN role.**

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

Update a product. **Requires ADMIN role.**

**Request Body:**
```json
{
  "name": "Café molido premium 250g",
  "category": "Bebidas",
  "price": 10.00,
  "stock": 30
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

Create a new sale (process checkout). Automatically updates product stock.

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

**Note:** Deleting a sale does not restore product stock or create compensating inventory movements. The original OUT movements remain in the audit log to preserve the complete history. If stock restoration is needed, consider using the inventory adjustment feature instead.

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

## Inventory

### POST /inventory/in

Add stock to a product (stock increase). **Requires ADMIN role.**

**Request Body:**
```json
{
  "product_id": 1,
  "qty": 50,
  "reason": "Compra a proveedor"
}
```

**Response:**
```json
{
  "success": true,
  "movement_id": 1,
  "product": {
    "id": 1,
    "name": "Arroz 1kg",
    "category": "Granos",
    "price": 9.50,
    "stock": 100,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T12:00:00.000Z"
  }
}
```

### POST /inventory/adjust

Adjust product stock (can be positive or negative). **Requires ADMIN role.**

**Request Body:**
```json
{
  "product_id": 1,
  "qty": -5,
  "reason": "Corrección de inventario - productos dañados"
}
```

**Note:** The `qty` parameter can be:
- Positive: to increase stock
- Negative: to decrease stock
- Must not result in negative stock (will return error if it would)

**Response:**
```json
{
  "success": true,
  "movement_id": 2,
  "adjustment": -5,
  "product": {
    "id": 1,
    "name": "Arroz 1kg",
    "category": "Granos",
    "price": 9.50,
    "stock": 95,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T12:30:00.000Z"
  }
}
```

### GET /inventory/movements

Get inventory movements with optional filters. **Requires ADMIN role.**

**Query Parameters (all optional):**
- `product_id` - Filter by product ID
- `type` - Filter by movement type (IN, OUT, ADJUST)
- `from` - Filter by date from (ISO format: YYYY-MM-DD)
- `to` - Filter by date to (ISO format: YYYY-MM-DD)
- `page` - Page number for pagination (default: 1)
- `limit` - Items per page (default: 50)

**Example:**
```
GET /inventory/movements?product_id=1&type=OUT&from=2025-01-01&to=2025-01-31&page=1&limit=20
```

**Response:**
```json
{
  "movements": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Arroz 1kg",
      "type": "OUT",
      "qty": 2,
      "reason": "SALE",
      "user_id": 1,
      "username": "zahir",
      "created_at": "2025-01-01T10:30:00.000Z"
    },
    {
      "id": 2,
      "product_id": 1,
      "product_name": "Arroz 1kg",
      "type": "IN",
      "qty": 50,
      "reason": "Compra a proveedor",
      "user_id": 1,
      "username": "zahir",
      "created_at": "2025-01-01T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

**Movement Types:**
- `IN` - Stock added (e.g., purchase from supplier)
- `OUT` - Stock removed (e.g., sale to customer)
- `ADJUST` - Stock adjustment (e.g., inventory correction, damaged goods)

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Descriptive error message"
}
```

Examples:
- Invalid quantity for inventory operations
- Insufficient stock for adjustments
- Missing required fields

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
- Product stock is automatically updated when a sale is created
- Sale items reference products but store the product name to preserve history even if the product is deleted
- **Inventory Management:**
  - Every sale automatically creates an OUT movement for audit purposes
  - Stock additions (IN) and adjustments (ADJUST) are ADMIN-only operations
  - All inventory movements are permanently recorded with user information
  - Movements can be filtered by product, type, and date range
  - Stock adjustments can be positive or negative but cannot result in negative inventory
