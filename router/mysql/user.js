const uuid = require('node-uuid');
const moment = require('moment');
const router = require("./index");
const db = require("../../config/db");

/**
 * 新增用户
 */
router.post('/user', async (req, res, next) => {
  let {
    username,
    password,
    name,
    age,
    sex,
    identity_card,
    role
  } = req.body;
  try {
    let q1 = await db.query(`SELECT * FROM g_book_manage_user WHERE username='${username}'`);
    if (q1.length) {
      return res.send({
        code: 202,
        msg: 'username字段重复!'
      })
    }
    let q2 = await db.query(`INSERT INTO g_book_manage_user VALUES(NULL,'${username}','${password}','${name}','${age}','${sex}','${identity_card}','${role}')`);
    res.send({
      code: null,
      msg: null
    });
  } catch(err) {
    console.log(err)
    res.send({
      code: 201,
      message: 'SQL语句相关字段错误!'
    });
  }
});

/**
 * 获取指定用户
 */
router.get('/user/:id', async (req, res, next) => {
  let { id } = req.params;
  try {
    let q = await db.query(`SELECT * FROM g_book_manage_user WHERE id='${id}'`);
    res.send({
      code: null,
      msg: null,
      data: q
    });
  } catch (err) {
    console.log(err)
    res.send({
      code: 201,
      message: 'SQL语句相关字段错误!'
    });
  }
});

/**
 * 获取所有用户
 */
router.get('/user', async (req, res, next) => {
  try {
    let q = await db.query(`SELECT * FROM g_book_manage_user`);
    res.send({
      code: null,
      msg: null,
      data: q
    });
  } catch(err) {
    console.log(err)
    res.send({
      code: 201,
      message: 'SQL语句相关字段错误!'
    });
  }
});


