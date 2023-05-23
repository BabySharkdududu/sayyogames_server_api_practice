// 導入 .env 環境變數
require('dotenv').config({ path: '.env' });

// 導入 redis
const Redis = require('ioredis');

// 設定 redis 連線
const redis = new Redis({
  host: process.env.localhost,
  port: process.env.redis_port,
});

module.exports = redis; // 輸出