// 導入 Koa
const Koa = require('koa');
const Router = require('koa-router');
const { koaBody }  = require('koa-body');

// 導入 mariadb
const mariadb = require('mariadb');

// 導入 redis
const Redis = require('ioredis');

// 設定 redis 連線資訊
const redis = new Redis({
  host: process.env.localhost,
  port: process.env.redis_port,
});
 
// 可使用環境變數
require('dotenv').config({ path: '.env' });

const app = new Koa();
const router = new Router();

app.use(koaBody());

// 建立連線設定
const pool = mariadb.createPool({
    host: process.env.localhost,
    user: process.env.mariadb_user,
    password: process.env.mariadb_password,
    database: process.env.mariadb_name,
    port: process.env.mariadb_port,
    waitForConnections: true,
    connectionLimit: 10 // 最大連線數
});


// 查詢資料 (所有)
router.post('/users', async (ctx) => {
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
});

// 設定 CRUD (新增、查詢、修改、刪除)
// 新增資料
router.post('/users/insert', async (ctx) => {
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
});

// 查詢資料 (單筆)
router.post('/users/query/:memid', async (ctx) => {
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
});

// 修改資料
router.post('/users/modify', async (ctx) => {
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
  });

// 刪除資料
router.post('/users/delete', async (ctx, next) => {
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
  });

app.use(router.routes());
app.listen(3000, () => {
  console.log('連接成功!! 可以開始測試!! 123123')
});