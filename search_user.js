const pool = require('./db_pool.js');
const redis = require('./redis.js');

// 查詢資料 (單筆)
module.exports = async (ctx) => {
    let conn, rows;
    try {
      const memid = parseInt(ctx.params.memid);
      console.log("現在查詢資料的memid:", memid);
      const redisKey = 'user'; 
      conn = await pool.getConnection(); // 連接 mariadb

      // 查詢 redis 全部暫存資料
      const redisData = await new Promise ((resolve, reject) => {
        redis.lrange(redisKey, 0, -1, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      console.log("暫存在 redis 的資料:", redisData);
      
      const targetData = redisData.find(data => {
        return JSON.parse(data).memid === memid;
      });
      
      if (!targetData) {
        rows = await conn.query('SELECT * FROM users WHERE memid = ?', [memid])
        ctx.body = rows;
      }
    } catch (err) {
      console.log('查詢資料 function 有錯誤,請檢察 3', err);
      ctx.body = { error: '查詢錯誤' };
    }
}