require('dotenv').config({ path: './server/.env' });
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Testing MySQL Database Connection...\n');
  
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

  console.log('📝 Connection Details:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}\n`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to MySQL database!\n');
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Found ${tables.length} tables in database:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    await connection.end();
    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Check if the database server is accessible');
    console.error('   2. Verify credentials in server/.env');
    console.error('   3. Ensure network allows connection to remote MySQL');
    process.exit(1);
  }
}

testConnection();
