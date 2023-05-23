const pool = require('./db_pool.js');

// 查詢資料 (所有)
module.exports = async (ctx) => {
    let conn, rows;
    try {
      conn = await pool.getConnection();
      rows = await conn.query('SELECT * FROM users');
    } catch (err) {
      throw err;
    } finally {
      if (conn) {
        conn.end();
      }
    }
    ctx.body = rows;
  };