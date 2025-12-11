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

// Get all products
router.get('/', requireAuth, async (req, res) => {
  try {
    // Calculate stock from stock_movements table
    const [products] = await pool.query(`
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
        ), 0) as stock,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.name, p.category, p.price, p.created_at, p.updated_at
      ORDER BY p.id ASC
    `);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Calculate stock from stock_movements table
    const [products] = await pool.query(`
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
        ), 0) as stock,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.category, p.price, p.created_at, p.updated_at
    `, [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { name, category, price, stock } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Insert product with initial stock (will be synced with movements)
    const [result] = await connection.query(
      'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)',
      [name, category || 'General', price, stock || 0]
    );

    const productId = result.insertId;

    // Create corresponding INGRESO movement if initial stock is provided
    if (stock && stock > 0) {
      await connection.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reason, user_id) 
         VALUES (?, 'INGRESO', ?, 'Stock inicial', ?)`,
        [productId, stock, req.session.user.id]
      );
    }

    await connection.commit();

    // Fetch the created product with calculated stock
    const [newProduct] = await connection.query(`
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
        ), 0) as stock,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.category, p.price, p.created_at, p.updated_at
    `, [productId]);
    
    res.status(201).json(newProduct[0]);

  } catch (error) {
    await connection.rollback();
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update product (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, category, price } = req.body;
    const { id } = req.params;

    // Check if product exists
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Only update name, category, and price - stock is managed through stock_movements
    await pool.query(
      'UPDATE products SET name = ?, category = ?, price = ? WHERE id = ?',
      [name, category, price, id]
    );

    // Fetch the updated product with calculated stock
    const [updated] = await pool.query(`
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
        ), 0) as stock,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.category, p.price, p.created_at, p.updated_at
    `, [id]);
    
    res.json(updated[0]);

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted' });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
