const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  next();
};

// Get all sales
router.get('/', requireAuth, async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT s.*, u.username 
      FROM sales s 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.created_at DESC
    `);

    // Get items for each sale
    for (let sale of sales) {
      const [items] = await db.query(
        'SELECT * FROM sale_items WHERE sale_id = ?',
        [sale.id]
      );
      sale.items = items;
    }

    res.json({ success: true, sales });
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo ventas' });
  }
});

// Create a new sale
router.post('/', requireAuth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { items } = req.body; // items: [{id, name, price, qty}]
    const userId = req.session.user.id;

    // Calculate total
    let total = 0;
    for (let item of items) {
      total += item.price * item.qty;
    }

    // Create sale record
    const [saleResult] = await connection.query(
      'INSERT INTO sales (user_id, total) VALUES (?, ?)',
      [userId, total]
    );

    const saleId = saleResult.insertId;

    // Insert sale items and update stock
    for (let item of items) {
      const subtotal = item.price * item.qty;
      
      // Insert sale item
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, item.id, item.name, item.price, item.qty, subtotal]
      );

      // Update product stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.qty, item.id]
      );
    }

    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Venta registrada',
      sale: { id: saleId, total }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error registrando venta:', error);
    res.status(500).json({ success: false, message: 'Error registrando venta' });
  } finally {
    connection.release();
  }
});

// Delete sale (Admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    await db.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Venta eliminada' });
  } catch (error) {
    console.error('Error eliminando venta:', error);
    res.status(500).json({ success: false, message: 'Error eliminando venta' });
  }
});

// Get sales reports
router.get('/reports/summary', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { period } = req.query; // 'today', 'week', 'month', 'all'
    
    let dateFilter = '';
    if (period === 'today') {
      dateFilter = 'WHERE DATE(s.created_at) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'WHERE YEARWEEK(s.created_at) = YEARWEEK(NOW())';
    } else if (period === 'month') {
      dateFilter = 'WHERE MONTH(s.created_at) = MONTH(NOW()) AND YEAR(s.created_at) = YEAR(NOW())';
    }

    // Total income
    const [totalResult] = await db.query(`
      SELECT COALESCE(SUM(total), 0) as totalIncome 
      FROM sales s 
      ${dateFilter}
    `);

    // Top products
    const [topProducts] = await db.query(`
      SELECT 
        si.product_name as name,
        SUM(si.quantity) as qty
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ${dateFilter}
      GROUP BY si.product_id, si.product_name
      ORDER BY qty DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      report: {
        totalIncome: totalResult[0].totalIncome,
        topProducts
      }
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ success: false, message: 'Error generando reporte' });
  }
});

module.exports = router;
