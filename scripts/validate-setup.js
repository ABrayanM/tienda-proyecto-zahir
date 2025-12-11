const mysql = require('mysql2/promise');
require('dotenv').config();

async function validateSetup() {
  console.log('🔍 Validating setup...\n');
  
  // Check environment variables
  console.log('📋 Checking environment variables...');
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  let missingVars = false;
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`   ❌ ${varName} is not set`);
      missingVars = true;
    } else {
      console.log(`   ✅ ${varName} is set`);
    }
  });
  
  if (missingVars) {
    console.log('\n❌ Please configure all required environment variables in .env file');
    process.exit(1);
  }
  
  // Check database connection
  console.log('\n🔌 Testing database connection...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('   ✅ Successfully connected to MySQL server');
    
    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const dbName = process.env.DB_NAME;
    const dbExists = databases.some(db => db.Database === dbName);
    
    if (dbExists) {
      console.log(`   ✅ Database '${dbName}' exists`);
      
      // Check tables
      await connection.query(`USE ${dbName}`);
      const [tables] = await connection.query('SHOW TABLES');
      const requiredTables = ['users', 'products', 'sales', 'sale_items', 'settings'];
      
      console.log('\n📊 Checking tables...');
      requiredTables.forEach(tableName => {
        const tableExists = tables.some(t => Object.values(t)[0] === tableName);
        if (tableExists) {
          console.log(`   ✅ Table '${tableName}' exists`);
        } else {
          console.log(`   ❌ Table '${tableName}' is missing`);
        }
      });
      
      // Check users
      const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n👤 Users in database: ${users[0].count}`);
      
      // Check products
      const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
      console.log(`📦 Products in database: ${products[0].count}`);
      
    } else {
      console.log(`   ⚠️  Database '${dbName}' does not exist`);
      console.log('   💡 Run: npm run init-db');
    }
    
    await connection.end();
    
  } catch (error) {
    console.log('   ❌ Failed to connect to database');
    console.log('   Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure MySQL server is running');
    console.log('   2. Check your credentials in .env file');
    console.log('   3. Verify the database user has proper permissions');
    process.exit(1);
  }
  
  console.log('\n✅ Setup validation complete!');
  console.log('\n🚀 You can now start the server with: npm start');
}

validateSetup().catch(console.error);
