const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function runQuery(pool, query, params = []) {
    let connection;

    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(query, params);
        return rows;
    } catch (error) {
        console.error('runQuery error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    runQuery,
};
