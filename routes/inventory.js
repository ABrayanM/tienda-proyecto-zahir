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

// POST /api/inventory/in - Add stock (ADMIN only)
router.post('/in', requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { product_id, qty, reason } = req.body;

    // Validate input
    if (!product_id || !qty || qty <= 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Product ID and positive quantity are required' });
    }

    // Check if product exists and lock it
    const [products] = await connection.query(
      'SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE',
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update product stock
    await connection.query(
      'UPDATE products SET stock = stock + ? WHERE id = ?',
      [qty, product_id]
    );

    // Insert inventory movement
    const [movementResult] = await connection.query(
      'INSERT INTO inventory_movements (product_id, type, qty, reason, user_id) VALUES (?, ?, ?, ?, ?)',
      [product_id, 'IN', qty, reason || 'Stock addition', req.session.user.id]
    );

    await connection.commit();

    // Get updated product
    const [updatedProduct] = await connection.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );

    res.status(201).json({
      success: true,
      movement_id: movementResult.insertId,
      product: updatedProduct[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// POST /api/inventory/adjust - Adjust stock (ADMIN only)
router.post('/adjust', requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { product_id, qty, reason } = req.body;

    // Validate input
    if (!product_id || qty === undefined || qty === null || qty === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Product ID and non-zero quantity are required' });
    }

    // Check if product exists and lock it
    const [products] = await connection.query(
      'SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE',
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentStock = products[0].stock;
    const newStock = currentStock + parseInt(qty);

    // Ensure stock never goes below 0
    if (newStock < 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: `Insufficient stock. Current: ${currentStock}, Adjustment: ${qty}, Result would be: ${newStock}` 
      });
    }

    // Update product stock
    await connection.query(
      'UPDATE products SET stock = ? WHERE id = ?',
      [newStock, product_id]
    );

    // Insert inventory movement - store the actual qty with sign to preserve direction
    const adjustmentReason = reason || (qty > 0 ? 'Stock increase adjustment' : 'Stock decrease adjustment');
    const [movementResult] = await connection.query(
      'INSERT INTO inventory_movements (product_id, type, qty, reason, user_id) VALUES (?, ?, ?, ?, ?)',
      [product_id, 'ADJUST', Math.abs(qty), `${adjustmentReason} (${qty > 0 ? '+' : ''}${qty})`, req.session.user.id]
    );

    await connection.commit();

    // Get updated product
    const [updatedProduct] = await connection.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );

    res.status(201).json({
      success: true,
      movement_id: movementResult.insertId,
      adjustment: qty,
      product: updatedProduct[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// GET /api/inventory/movements - List movements with filters (ADMIN only)
router.get('/movements', requireAdmin, async (req, res) => {
  try {
    const { product_id, type, from, to, page = 1, limit = 50 } = req.query;
    
    let whereConditions = [];
    let queryParams = [];

    // Build WHERE clause based on filters
    if (product_id) {
      whereConditions.push('im.product_id = ?');
      queryParams.push(product_id);
    }

    if (type && ['IN', 'OUT', 'ADJUST'].includes(type)) {
      whereConditions.push('im.type = ?');
      queryParams.push(type);
    }

    if (from) {
      whereConditions.push('im.created_at >= ?');
      queryParams.push(from);
    }

    if (to) {
      whereConditions.push('im.created_at <= ?');
      queryParams.push(to);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    queryParams.push(parseInt(limit), offset);

    // Get movements with product name and username
    const [movements] = await pool.query(`
      SELECT 
        im.id,
        im.product_id,
        p.name as product_name,
        im.type,
        im.qty,
        im.reason,
        im.user_id,
        u.username,
        im.created_at
      FROM inventory_movements im
      LEFT JOIN products p ON im.product_id = p.id
      LEFT JOIN users u ON im.user_id = u.id
      ${whereClause}
      ORDER BY im.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParams);

    // Get total count for pagination
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM inventory_movements im
      ${whereClause}
    `, countParams);

    res.json({
      movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
