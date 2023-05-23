const pool = require('./db_pool.js');

// 刪除資料
module.exports = async (ctx, next) => {
    const { memid } = ctx.request.body;
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('DELETE FROM users WHERE memid = ?', [memid]);
    } catch (err) {
      throw err;
    } finally {
      if (conn) {
        conn.end();
      }
    }
    ctx.status = 204;
  };

