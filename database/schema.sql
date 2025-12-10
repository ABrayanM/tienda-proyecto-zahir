-- Crear base de datos
CREATE DATABASE IF NOT EXISTS tienda_zahir CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_zahir;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'CAJERO') DEFAULT 'CAJERO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de items de venta
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar usuarios por defecto (contraseñas sin encriptar para desarrollo, usar bcrypt en producción)
INSERT INTO users (username, password, role) VALUES
  ('zahir', 'programador', 'ADMIN'),
  ('cajero', '1234', 'CAJERO'),
  ('brayan', 'cajero', 'ADMIN')
ON DUPLICATE KEY UPDATE username=username;

-- Insertar productos de ejemplo
INSERT INTO products (name, category, price, stock) VALUES
  ('Arroz 1kg', 'Granos', 9.50, 50),
  ('Azúcar 1kg', 'Dulces', 4.20, 40),
  ('Aceite 1L', 'Aceites', 12.00, 30),
  ('Leche 1L', 'Lácteos', 3.80, 60),
  ('Fideos 500g', 'Pastas', 2.50, 80),
  ('Pollo entero', 'Carnes', 18.00, 15),
  ('Pan', 'Panadería', 1.20, 100),
  ('Café 250g', 'Bebidas', 8.75, 25)
ON DUPLICATE KEY UPDATE id=id;
