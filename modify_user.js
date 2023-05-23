const pool = require('./db_pool.js');

// 修改資料
module.exports = async (ctx) => {
  const { memid, name, tel } = ctx.request.body;
  let conn;

  try {
    conn = await pool.getConnection();
    await conn.query('UPDATE users SET name = ?, tel = ? WHERE memid = ?', [name, tel, memid]);
  } catch (err) {
    throw err;
  } finally {
    if (conn) {
      conn.end();
    }
  }

  ctx.status = 204;
}