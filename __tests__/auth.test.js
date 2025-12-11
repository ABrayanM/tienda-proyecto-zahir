const request = require('supertest');
const express = require('express');
const session = require('express-session');
const authRoutes = require('../src/routes/auth');

// Mock database
jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));

const db = require('../src/config/db');

describe('Authentication Routes', () => {
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
    app.use('/auth', authRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('usuario');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('contraseña');
    });

    it('should return 400 if username is too short', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'ab', password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 if credentials are invalid', async () => {
      db.query.mockResolvedValue([[]]);

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'wrongpass' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrectos');
    });

    it('should return 200 and create session on valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'ADMIN'
      };
      
      db.query.mockResolvedValue([[mockUser]]);

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'correctpass' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('role', 'ADMIN');
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /auth/check', () => {
    it('should return authenticated false when no session', async () => {
      const response = await request(app)
        .get('/auth/check');

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
    });
  });
});
