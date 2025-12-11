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

// Get all stock movements with optional filters
router.get('/', requireAuth, async (req, res) => {
  try {
    const { product_id, movement_type, start_date, end_date, limit = 100 } = req.query;
    
    let query = `
      SELECT sm.*, p.name as product_name, u.username 
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      query += ' AND sm.product_id = ?';
      params.push(product_id);
    }

    if (movement_type) {
      query += ' AND sm.movement_type = ?';
      params.push(movement_type);
    }

    if (start_date) {
      query += ' AND sm.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND sm.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY sm.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [movements] = await pool.query(query, params);
    res.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stock movements for a specific product
router.get('/product/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const [movements] = await pool.query(`
      SELECT sm.*, u.username 
      FROM stock_movements sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.product_id = ?
      ORDER BY sm.created_at DESC
    `, [productId]);

    res.json(movements);
  } catch (error) {
    console.error('Error fetching product movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current stock for all products (calculated from movements)
router.get('/current-stock', requireAuth, async (req, res) => {
  try {
    const [stockData] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        COALESCE(SUM(
          CASE 
            WHEN sm.movement_type = 'INGRESO' THEN sm.quantity
            WHEN sm.movement_type = 'EGRESO' THEN -sm.quantity
            ELSE 0
          END
        ), 0) as stock
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY p.id
    `);

    res.json(stockData);
  } catch (error) {
    console.error('Error calculating current stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new stock movement (admin only for manual entries)
router.post('/', requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { product_id, movement_type, quantity, reason } = req.body;

    // Validation
    if (!product_id || !movement_type || !quantity) {
      return res.status(400).json({ error: 'product_id, movement_type, and quantity are required' });
    }

    if (!['INGRESO', 'EGRESO'].includes(movement_type)) {
      return res.status(400).json({ error: 'movement_type must be INGRESO or EGRESO' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be greater than 0' });
    }

    // Check if product exists
    const [products] = await connection.query(
      'SELECT id, stock FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    // For EGRESO, check if there's enough stock
    if (movement_type === 'EGRESO') {
      const [stockResult] = await connection.query(`
        SELECT COALESCE(SUM(
          CASE 
            WHEN movement_type = 'INGRESO' THEN quantity
            WHEN movement_type = 'EGRESO' THEN -quantity
            ELSE 0
          END
        ), 0) as current_stock
        FROM stock_movements
        WHERE product_id = ?
      `, [product_id]);

      const currentStock = stockResult[0].current_stock;
      if (currentStock < quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}` 
        });
      }
    }

    // Insert stock movement
    const [result] = await connection.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, reason, user_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, movement_type, quantity, reason || 'Manual adjustment', req.session.user.id]
    );

    // Update product stock field for consistency
    const stockChange = movement_type === 'INGRESO' ? quantity : -quantity;
    await connection.query(
      'UPDATE products SET stock = stock + ? WHERE id = ?',
      [stockChange, product_id]
    );

    await connection.commit();

    // Fetch the created movement
    const [newMovement] = await connection.query(`
      SELECT sm.*, p.name as product_name, u.username 
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.id = ?
    `, [result.insertId]);

    res.status(201).json(newMovement[0]);

  } catch (error) {
    await connection.rollback();
    console.error('Error creating stock movement:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Get stock summary (total ingresos, egresos, current stock)
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) as total_movements,
        SUM(CASE WHEN movement_type = 'INGRESO' THEN quantity ELSE 0 END) as total_ingresos,
        SUM(CASE WHEN movement_type = 'EGRESO' THEN quantity ELSE 0 END) as total_egresos,
        SUM(CASE 
          WHEN movement_type = 'INGRESO' THEN quantity 
          WHEN movement_type = 'EGRESO' THEN -quantity 
          ELSE 0 
        END) as current_total_stock
      FROM stock_movements
    `);

    res.json(summary[0]);
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
