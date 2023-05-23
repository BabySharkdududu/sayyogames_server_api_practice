const pool = require('./db_pool.js');
const redis = require('./redis.js');

// 新增資料
module.exports = async (ctx) => {
    const { name, tel } = ctx.request.body;
    let conn;
    try {
      conn = await pool.getConnection(); // 連接 mariadb
      const rows = await conn.query(`INSERT INTO users (name, tel) VALUES (?, ?)`, [name, tel]); // 寫入新增資料
      if (rows.affectedRows === 0) {
        ctx.body = { error: '新增資料 function 有錯誤,請檢察 1' };
      } else {
        ctx.body = { success: true };
        const insertId = Number(rows.insertId.toString()); // 將原本 insertId 後面的 "n" 消除
        // console.log("insertId:", insertId);
        try {
          const redisKey = 'user'; // redis 暫存 key 名稱
          const data = { memid: insertId, name: name, tel: tel }; // redis 暫存資料
          const jsonData = JSON.stringify(data);
          
          // 將資料暫存進 redis
          redis.rpush(redisKey, jsonData, (err, result) => {
            if (err) {
              console.error('redis無法暫存資料:', err);
            } else {
              console.log('成功將資料暫存到redis:', result);

              // 設定暫存資料 60 秒後刪除
              setTimeout(() => {
                redis.lrem(redisKey, 1, jsonData, (err, result) => {
                  if (err) {
                    console.error('無法刪除redis暫存資料:', err);
                  } else {
                    console.log('已經刪除redis暫存資料:', result);
                  }
                });
              }, 60000);
            }
          });
        } catch (err) {
          console.error('無法連上redis:', err);
        }
      }
    } catch (err) {
      console.log(err);
      ctx.body = { error: '新增資料 function 有錯誤,請檢察 2' };
    }
}