const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
// const bcrypt = require('bcryptjs'); // Uncomment to use password hashing

// Login endpoint with validation
router.post('/login', [
  body('username').trim().notEmpty().withMessage('El usuario es requerido').isLength({ min: 3, max: 50 }).withMessage('El usuario debe tener entre 3 y 50 caracteres'),
  body('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 1, max: 255 }).withMessage('La contraseña es inválida')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    // NOTE: For development/demo purposes, passwords are stored in plain text.
    // TODO: In production, implement bcrypt hashing:
    // 1. Hash passwords before storing: bcrypt.hash(password, 10)
    // 2. Compare with stored hash: bcrypt.compare(password, user.password)
    
    // Buscar usuario
    const [users] = await db.query(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    const user = users[0];
    
    // Crear sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({ 
      success: true, 
      user: { username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
    }
    res.json({ success: true });
  });
});

// Check session endpoint
router.get('/check', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
