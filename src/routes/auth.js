const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

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
