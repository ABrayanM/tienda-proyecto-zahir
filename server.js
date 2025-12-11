const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - helmet for HTTP headers security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  }
}));

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Demasiados intentos de inicio de sesión, por favor intente más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'tienda-zahir-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Make session available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const salesRoutes = require('./src/routes/sales');
const settingsRoutes = require('./src/routes/settings');

// Apply rate limiters
app.use('/auth', authLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/sales', apiLimiter, salesRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

// Main routes
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Error interno del servidor');
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
