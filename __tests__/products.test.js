const request = require('supertest');
const express = require('express');
const session = require('express-session');
const productRoutes = require('../src/routes/products');

// Mock database
jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));

const db = require('../src/config/db');

describe('Product Routes', () => {
  let app;

  beforeEach(() => {
    // Create a minimal Express app for testing
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }));
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.session.user = { id: 1, username: 'testuser', role: 'ADMIN' };
      next();
    });
    
    app.use('/api/products', productRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 10.50, stock: 100 },
        { id: 2, name: 'Product 2', price: 20.00, stock: 50 }
      ];
      
      db.query.mockResolvedValue([mockProducts]);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app).get('/api/products/abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if product not found', async () => {
      db.query.mockResolvedValue([[]]);

      const response = await request(app).get('/api/products/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return product if found', async () => {
      const mockProduct = { id: 1, name: 'Product 1', price: 10.50, stock: 100 };
      db.query.mockResolvedValue([[mockProduct]]);

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product).toHaveProperty('name', 'Product 1');
    });
  });

  describe('POST /api/products', () => {
    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ price: 10.50, stock: 100 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if price is invalid', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product', price: -5, stock: 100 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should create product with valid data', async () => {
      db.query.mockResolvedValue([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/products')
        .send({ name: 'New Product', price: 15.99, stock: 50, category: 'Test' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product).toHaveProperty('name', 'New Product');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/products/abc')
        .send({ name: 'Updated', price: 20 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should update product with valid data', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/products/1')
        .send({ name: 'Updated Product', price: 25.99, stock: 75, category: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app).delete('/api/products/abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should delete product successfully', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authorization checks', () => {
    let restrictedApp;

    beforeEach(() => {
      restrictedApp = express();
      restrictedApp.use(express.json());
      restrictedApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));
      
      // Mock CAJERO role
      restrictedApp.use((req, res, next) => {
        req.session.user = { id: 2, username: 'cajero', role: 'CAJERO' };
        next();
      });
      
      restrictedApp.use('/api/products', productRoutes);
    });

    it('should deny product creation for non-admin', async () => {
      const response = await request(restrictedApp)
        .post('/api/products')
        .send({ name: 'Test', price: 10 });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should deny product update for non-admin', async () => {
      const response = await request(restrictedApp)
        .put('/api/products/1')
        .send({ name: 'Test', price: 10 });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should deny product deletion for non-admin', async () => {
      const response = await request(restrictedApp)
        .delete('/api/products/1');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
