const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

// Get all settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings');
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single setting
router.get('/:key', requireAuth, async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT * FROM settings WHERE setting_key = ?',
      [req.params.key]
    );

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: settings[0].setting_key, value: settings[0].setting_value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update or create setting (admin only)
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    await pool.query(`
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE setting_value = ?
    `, [key, value, value]);

    res.json({ success: true, key, value });

  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete setting (admin only)
router.delete('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    const [existing] = await pool.query('SELECT * FROM settings WHERE setting_key = ?', [key]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    await pool.query('DELETE FROM settings WHERE setting_key = ?', [key]);
    res.json({ success: true, message: 'Setting deleted' });

  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
