const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    // Connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('📦 Initializing database...');

    // Create database
    const dbName = process.env.DB_NAME || 'tienda_zahir';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Use the database
    await connection.query(`USE ${dbName}`);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'CAJERO') NOT NULL DEFAULT 'CAJERO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "users" created');

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "products" created');

    // Create sales table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATETIME NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Table "sales" created');

    // Create sale_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sale_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        qty INT NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Table "sale_items" created');

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "settings" created');

    // Insert default users
    const hashedZahir = await bcrypt.hash('programador', 10);
    const hashedCajero = await bcrypt.hash('1234', 10);
    const hashedBrayan = await bcrypt.hash('cajero', 10);

    await connection.query(`
      INSERT INTO users (username, password, role) VALUES
      ('zahir', ?, 'ADMIN'),
      ('cajero', ?, 'CAJERO'),
      ('brayan', ?, 'ADMIN')
      ON DUPLICATE KEY UPDATE username=username
    `, [hashedZahir, hashedCajero, hashedBrayan]);
    console.log('✅ Default users inserted');

    // Insert seed products
    await connection.query(`
      INSERT INTO products (id, name, category, price, stock) VALUES
      (1, 'Arroz 1kg', 'Granos', 9.50, 50),
      (2, 'Azúcar 1kg', 'Dulces', 4.20, 40),
      (3, 'Aceite 1L', 'Aceites', 12.00, 30),
      (4, 'Leche 1L', 'Lácteos', 3.80, 60),
      (5, 'Fideos 500g', 'Pastas', 2.50, 80),
      (6, 'Pollo entero', 'Carnes', 18.00, 15),
      (7, 'Pan', 'Panadería', 1.20, 100),
      (8, 'Café 250g', 'Bebidas', 8.75, 25)
      ON DUPLICATE KEY UPDATE name=name
    `);
    console.log('✅ Seed products inserted');

    // Insert default logo setting (using relative path)
    await connection.query(`
      INSERT INTO settings (setting_key, setting_value) VALUES
      ('logo', './img/logo.png')
      ON DUPLICATE KEY UPDATE setting_key=setting_key
    `);
    console.log('✅ Default settings inserted');

    console.log('\n🎉 Database initialization completed successfully!\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initDatabase();
