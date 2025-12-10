const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to check authentication and admin role
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  next();
};

// Get setting
router.get('/:key', requireAdmin, async (req, res) => {
  try {
    const [settings] = await db.query(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      [req.params.key]
    );
    
    if (settings.length === 0) {
      return res.json({ success: true, value: null });
    }

    res.json({ success: true, value: settings[0].setting_value });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo configuración' });
  }
});

// Save/Update setting
router.post('/:key', requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    
    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [req.params.key, value, value]
    );

    res.json({ success: true, message: 'Configuración guardada' });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    res.status(500).json({ success: false, message: 'Error guardando configuración' });
  }
});

// Reset all data (Admin only)
router.post('/reset/all', requireAdmin, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Clear data
    await connection.query('DELETE FROM sale_items');
    await connection.query('DELETE FROM sales');
    await connection.query('DELETE FROM products');
    await connection.query('DELETE FROM settings WHERE setting_key != "logo"');

    await connection.commit();

    res.json({ success: true, message: 'Datos reiniciados' });
  } catch (error) {
    await connection.rollback();
    console.error('Error reiniciando datos:', error);
    res.status(500).json({ success: false, message: 'Error reiniciando datos' });
  } finally {
    connection.release();
  }
});

module.exports = router;
