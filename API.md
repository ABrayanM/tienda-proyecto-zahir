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
- Product stock is automatically updated when a sale is created
- Sale items reference products but store the product name to preserve history even if the product is deleted
