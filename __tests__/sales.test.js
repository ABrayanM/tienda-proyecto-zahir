const request = require('supertest');
const express = require('express');
const session = require('express-session');
const salesRoutes = require('../src/routes/sales');

// Mock database
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const db = require('../src/config/db');

describe('Sales Routes', () => {
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
    
    app.use('/api/sales', salesRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/sales', () => {
    it('should return all sales with items', async () => {
      const mockSales = [
        { id: 1, user_id: 1, total: 100.50, created_at: new Date(), username: 'testuser' }
      ];
      const mockItems = [
        { id: 1, sale_id: 1, product_name: 'Product 1', quantity: 2, price: 50.25 }
      ];
      
      db.query
        .mockResolvedValueOnce([mockSales])
        .mockResolvedValueOnce([mockItems]);

      const response = await request(app).get('/api/sales');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sales).toHaveLength(1);
      expect(response.body.sales[0].items).toHaveLength(1);
    });
  });

  describe('POST /api/sales', () => {
    it('should return 400 if items array is empty', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({ items: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if items are invalid', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({ 
          items: [{ id: 1, name: 'Test', price: -5, qty: 1 }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should create sale with valid items', async () => {
      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        query: jest.fn()
          .mockResolvedValueOnce([{ insertId: 1 }])
          .mockResolvedValue([{ affectedRows: 1 }]),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
      };
      
      db.getConnection.mockResolvedValue(mockConnection);

      const response = await request(app)
        .post('/api/sales')
        .send({ 
          items: [
            { id: 1, name: 'Product 1', price: 10.50, qty: 2 },
            { id: 2, name: 'Product 2', price: 15.00, qty: 1 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sale).toHaveProperty('total', 36);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        query: jest.fn().mockRejectedValue(new Error('Database error')),
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
      };
      
      db.getConnection.mockResolvedValue(mockConnection);

      const response = await request(app)
        .post('/api/sales')
        .send({ 
          items: [{ id: 1, name: 'Product 1', price: 10.50, qty: 2 }]
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/sales/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app).delete('/api/sales/abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should delete sale successfully', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/sales/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/sales/reports/summary', () => {
    it('should return 400 for invalid period', async () => {
      const response = await request(app)
        .get('/api/sales/reports/summary?period=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return summary report for valid period', async () => {
      db.query
        .mockResolvedValueOnce([[{ totalIncome: 500.00 }]])
        .mockResolvedValueOnce([[
          { name: 'Product 1', qty: 10 },
          { name: 'Product 2', qty: 5 }
        ]]);

      const response = await request(app)
        .get('/api/sales/reports/summary?period=today');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toHaveProperty('totalIncome', 500.00);
      expect(response.body.report.topProducts).toHaveLength(2);
    });
  });

  describe('Authorization checks for reports', () => {
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
      
      restrictedApp.use('/api/sales', salesRoutes);
    });

    it('should deny report access for non-admin', async () => {
      const response = await request(restrictedApp)
        .get('/api/sales/reports/summary?period=today');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
