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

// Get all sales
router.get('/', requireAuth, async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT s.*, u.username 
      FROM sales s 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.date DESC
    `);

    // Get items for each sale
    for (let sale of sales) {
      const [items] = await pool.query(
        'SELECT * FROM sale_items WHERE sale_id = ?',
        [sale.id]
      );
      sale.items = items;
    }

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single sale
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [sales] = await pool.query(
      'SELECT s.*, u.username FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ?',
      [req.params.id]
    );

    if (sales.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = sales[0];
    const [items] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
    sale.items = items;

    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sale (process checkout)
router.post('/', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Create sale record
    const [saleResult] = await connection.query(
      'INSERT INTO sales (date, total, user_id) VALUES (NOW(), ?, ?)',
      [total, req.session.user.id]
    );

    const saleId = saleResult.insertId;

    // Insert sale items and update product stock
    for (const item of items) {
      // Insert sale item
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, product_name, price, qty) VALUES (?, ?, ?, ?, ?)',
        [saleId, item.id, item.name, item.price, item.qty]
      );

      // Update product stock
      await connection.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [item.qty, item.id]
      );
    }

    await connection.commit();

    // Fetch the created sale with items
    const [newSale] = await connection.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    const [saleItems] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
    newSale[0].items = saleItems;

    res.status(201).json(newSale[0]);

  } catch (error) {
    await connection.rollback();
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Delete sale (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Sale items will be deleted automatically due to CASCADE
    await pool.query('DELETE FROM sales WHERE id = ?', [id]);
    res.json({ success: true, message: 'Sale deleted' });

  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all sales (admin only)
router.delete('/', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM sales');
    res.json({ success: true, message: 'All sales cleared' });
  } catch (error) {
    console.error('Error clearing sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
