const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'store_rating_db',
  });

  try {
    console.log('Seeding initial demo data for Store Rating Application...');

    // 1. Ensure users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(400) NOT NULL,
        role ENUM('ADMIN', 'USER', 'OWNER') NOT NULL DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Ensure stores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(255) NOT NULL,
        address VARCHAR(400) NOT NULL,
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Ensure ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        store_id INT NOT NULL,
        value INT NOT NULL CHECK (value >= 1 AND value <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_store (user_id, store_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    const adminHash = await bcrypt.hash('Admin@123', 10);
    const ownerHash = await bcrypt.hash('Owner@123', 10);
    const userHash = await bcrypt.hash('User@123', 10);

    // Seed Admin
    await pool.query(`
      INSERT INTO users (name, email, password, address, role)
      VALUES ('System Administrator Admin', 'admin@storerating.com', ?, '123 Central HQ Boulevard, Suite 100, Admin City', 'ADMIN')
      ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), address = VALUES(address), role = 'ADMIN'
    `, [adminHash]);

    // Seed Store Owner Alex
    await pool.query(`
      INSERT INTO users (name, email, password, address, role)
      VALUES ('Store Owner Alex Johnson', 'alex.owner@storerating.com', ?, '456 Commerce Avenue, Suite 200, Business District', 'OWNER')
      ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), address = VALUES(address), role = 'OWNER'
    `, [ownerHash]);

    // Seed Normal User Jessica
    await pool.query(`
      INSERT INTO users (name, email, password, address, role)
      VALUES ('Jessica Maria Martinez', 'jessica@example.com', ?, '789 Residential Gardens, Apt 4B, Metropolis', 'USER')
      ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), address = VALUES(address), role = 'USER'
    `, [userHash]);

    // Get Owner ID
    const [[alex]] = await pool.query("SELECT id FROM users WHERE email = 'alex.owner@storerating.com'");
    const [[jessica]] = await pool.query("SELECT id FROM users WHERE email = 'jessica@example.com'");

    // Seed Stores
    const [existingStore] = await pool.query("SELECT id FROM stores WHERE email = 'contact@alexsupermarket.com'");
    let store1Id;
    if (existingStore.length === 0) {
      const [res] = await pool.query(`
        INSERT INTO stores (name, email, address, owner_id)
        VALUES ('Alex Downtown Supermarket', 'contact@alexsupermarket.com', '100 Market Street, Downtown Central Plaza', ?)
      `, [alex.id]);
      store1Id = res.insertId;
    } else {
      store1Id = existingStore[0].id;
    }

    // Seed Rating
    await pool.query(`
      INSERT INTO ratings (user_id, store_id, value)
      VALUES (?, ?, 4)
      ON DUPLICATE KEY UPDATE value = 4
    `, [jessica.id, store1Id]);

    console.log('Seed executed successfully!');
    console.log('Default credentials:');
    console.log('  1. System Administrator: admin@storerating.com / Admin@123');
    console.log('  2. Store Owner:          alex.owner@storerating.com / Owner@123');
    console.log('  3. Normal User:          jessica@example.com / User@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
