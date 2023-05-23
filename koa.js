// 導入 Koa
const Koa = require('koa');
const Router = require('koa-router');
const { koaBody }  = require('koa-body');
 
const app = new Koa();
const router = new Router();

app.use(koaBody());
app.use(router.routes());

// 查詢資料 (所有)
const search_all_users = require('./search_all_users.js');
router.post('/users', search_all_users);

// CRUD (新增、查詢、修改、刪除)
// 新增資料
const new_user = require('./new_user.js');
router.post('/users/insert', new_user);

// 查詢資料 (單筆)
const search_user = require('./search_user.js');
router.post('/users/query/:memid', search_user);

// 修改資料
const modify_user = require('./modify_user.js');
router.post('/users/modify', modify_user);

// 刪除資料
const delete_user = require('./delete_user.js');
router.post('/users/delete', delete_user);

app.listen(3000, () => {
  console.log('連接成功!! 可以開始測試!! 123123')
})