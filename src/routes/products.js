const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../config/db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  next();
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  next();
};

// Validation middleware
const validateProduct = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('La categoría no puede exceder 50 caracteres'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo')
];

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido')
];

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

// Get all products
router.get('/', requireAuth, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY name');
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo productos' });
  }
});

// Get single product
router.get('/:id', requireAuth, validateId, handleValidationErrors, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.json({ success: true, product: products[0] });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo producto' });
  }
});

// Create product (Admin only)
router.post('/', requireAdmin, validateProduct, handleValidationErrors, async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)',
      [name, category || 'General', price, stock || 0]
    );

    res.json({ 
      success: true, 
      message: 'Producto creado',
      product: { id: result.insertId, name, category, price, stock }
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ success: false, message: 'Error creando producto' });
  }
});

// Update product (Admin only)
router.put('/:id', requireAdmin, validateId, validateProduct, handleValidationErrors, async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    
    await db.query(
      'UPDATE products SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?',
      [name, category, price, stock, req.params.id]
    );

    res.json({ success: true, message: 'Producto actualizado' });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ success: false, message: 'Error actualizando producto' });
  }
});

// Delete product (Admin only)
router.delete('/:id', requireAdmin, validateId, handleValidationErrors, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ success: false, message: 'Error eliminando producto' });
  }
});

module.exports = router;
