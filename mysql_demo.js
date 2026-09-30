require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function main() {
    try {
        console.log('Connecting to MySQL Database...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("-> 'categories' table is ready.");

        await setupDatabaseAndSeedData(pool);

        
        await runQuestion1(pool);


        await runQuestion2(pool, 'Wireless');

        await runQuestion3(pool);

        await runQuestion4(pool);

    } catch (error) { 
        console.error('MySQL error:', error.message);
    } finally {
        await pool.end();
    }
}

async function setupDatabaseAndSeedData(pool) {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL,
            item_name VARCHAR(150) NOT NULL,
            price DECIMAL(12,2) NOT NULL,
            quantity INT DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        )
    `);

    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.query('TRUNCATE TABLE items;');
    await pool.query('TRUNCATE TABLE categories;');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

    await pool.query(`
        INSERT INTO categories (name, description) VALUES
        ('Food', 'Daily essentials and groceries'),
        ('Electronics', 'Gadgets, phones and computers'),
        ('Clothing', 'Apparel and fashion items'),
        ('Books', 'Educational and entertainment books'),
        ('Home & Living', 'Furniture and home appliances'),
        ('Sports & Outdoors', 'Sporting goods and outdoor equipment');
    `);

    await pool.query(`
        INSERT INTO items (category_id, item_name, price, quantity) VALUES
        (1, 'Apple', 25000.00, 100),
        (1, 'Milk', 32000.00, 50),
        (1, 'Bread', 15000.00, 30),
        (2, 'Smartphone', 5500000.00, 15),
        (2, 'Wireless Mouse', 250000.00, 40),
        (3, 'T-Shirt', 120000.00, 60),
        (3, 'Jeans', 350000.00, 25),
        (4, 'Node.js Programming', 180000.00, 20),
        (5, 'Desk Lamp', 150000.00, 35),
        (5, 'Coffee Mug', 45000.00, 80);
    `);
    console.log('-> Table structure and sample data initialized successfully!');
}

async function runQuestion1(pool) {
    try {
        console.log('\n--- EXECUTING QUESTION 1: Filter & Sort ---');
        const sql = 'SELECT * FROM items WHERE price >= ? AND quantity > 0 ORDER BY price DESC';
        const [rows] = await pool.execute(sql, [500000]);

        console.log('-> Query result:', rows);
    } catch (error) {
        console.error('Error in Question 1:', error.message);
    }
}

async function runQuestion2(pool, keyword) {
    try {
        console.log(`\n--- EXECUTING QUESTION 2: Wildcard / LIKE search for "${keyword}" ---`);
        const searchTerm = `%${keyword}%`;
        const sql = 'SELECT * FROM items WHERE item_name LIKE ?';
        const [rows] = await pool.execute(sql, [searchTerm]);

        console.log('-> Query result:', rows);
        return rows;
    } catch (error) {
        console.error('Error in Question 2:', error.message);
    }
}

async function runQuestion3(pool) {
    try {
        console.log('\n--- EXECUTING QUESTION 3: Aggregate functions ---');
        const sql = 'SELECT SUM(quantity) AS totalStock, AVG(price) AS avgPrice, COUNT(*) AS totalItems FROM items';
        const [rows] = await pool.execute(sql);

        console.log('-> Query result:', rows);
    } catch (error) {
        console.error('Error in Question 3:', error.message);
    }
}

async function runQuestion4(pool) {
    try {
        console.log('\n--- EXECUTING QUESTION 4: Category statistics (GROUP BY & HAVING) ---');
        const sql = `
            SELECT c.name, COUNT(i.id) as totalItems, SUM(i.price * i.quantity) as totalInventoryValue
            FROM categories c
            JOIN items i ON c.id = i.category_id
            GROUP BY c.id, c.name
            HAVING totalInventoryValue > ?
        `;
        const [rows] = await pool.execute(sql, [10000000]);

        console.log('-> Query result:', rows);
    } catch (error) {
        console.error('Error in Question 4:', error.message);
    }
}
main();