// 導入 .env 環境變數
require('dotenv').config({ path: '.env' });

// 導入 mariadb
const mariadb = require('mariadb');

// db_pool 連線設定
const pool = mariadb.createPool({
  host: process.env.localhost,
  user: process.env.mariadb_user,
  password: process.env.mariadb_password,
  database: process.env.mariadb_name,
  port: process.env.mariadb_port,
  waitForConnections: true,
  connectionLimit: 10 // 最大連線數
});

module.exports = pool; // 輸出