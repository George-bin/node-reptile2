const uuid = require('node-uuid');
const moment = require('moment');
const router = require("./index");
const db = require("../../config/db");

// 保存分类
router.post('/class/save', async (req, res, next) => {
    let uid = uuid.v1();
    uid = uid.replace(/-/g,'');
    let {name} = req.body;
    try {
        let q1 = await db.query(`SELECT * FROM g_book_class WHERE name='${name}'`)
        if (q1.length) {
            return res.send({
                code: 202,
                msg: 'name字段重复啦～～～'
            })
        }
        await db.query(`INSERT INTO g_book_class VALUES('${uid}','${name}');`)
        res.send({
            code: null,
            message: null,
            data: {
                id: uid,
                name
            }
        })
    } catch(err) {
        console.log(err);
        res.send({
            code: 201,
            message: 'SQL语句出错啦~~~'
        });
    }
});

// 保存书籍
router.post('/save', async (req, res, next) => {
  let {
    name,
    author,
    cover,
    hot,
    score,
    des,
    label,
    chapter_count,
    c_id
  } = req.body;
  let dataTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  try {
    let q1 = await db.query(`SELECT * FROM g_book WHERE name='${name}'`)
    if (q1.length) {
      return res.send({
        code: 202,
        msg: 'name字段重复啦～～～'
      })
    }
    let q2 = await db.query(`INSERT INTO g_book VALUES(NULL,'${name}','${author}',
      '${cover}','${hot}','${score}','${des}','${label}',
      '${chapter_count}','${dataTime}','${dataTime}','${c_id}')`);
    res.send({
      code: null,
      msg: null
    })
  } catch(err) {
    console.log(err)
    res.send({
      code: 201,
      message: 'SQL语句出错啦~~~',
    })
  }
});

// 根据分类查询
router.get('/listByClass/:c_id', async (req, res, next) => {
  let { c_id } = req.params;
  let q = await db.query(`SELECT * FROM g_book WHERE c_id='${c_id}';`);
  console.log(q)
  res.send({
    code: null,
    msg: null,
    data: q
  })
});

// 保存书籍2
router.post('/save2', async (req, res, next) => {
    let {
        name,
        author,
        cover,
        hot,
        score,
        des,
        label,
        chapter_count,
        c_id
    } = req.body;
    let dataTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

    // 1.初始化一个连接对象并初始化连接
    let dbConn = new db.DBUnity(await db.getConnection());
    // 2.开启事务
    await dbConn.beginTransaction();
    try {
        // 执行语句
        let q1 = await dbConn.query(`SELECT * FROM g_book WHERE name='${name}'`)
        console.log(q1)
        if (!q1.success) {
            dbConn.rollback();
            return res.send({
                code: 203,
                message: '数据库连接错误~~~'
            })
        }
        if (q1.data.length) {
            dbConn.rollback();
            return res.send({
                code: 202,
                message: '数据重复啦~~~',
                data: q1.data
            })
        }
        let q2 = await db.query(`INSERT INTO g_book VALUES(NULL,'${name}','${author}','${cover}','${hot}','${score}','${des}','${label}','${chapter_count}','${dataTime}','${dataTime}','${c_id}')`)
        if (!q2.success) {
            console.log('插入数据库失败~~~')
            dbConn.rollback();
            return res.send({
                code: 203,
                message: '数据库连接错误~~~'
            })
        }

        // 提交事务并释放连接
        dbConn.commit()
        res.send({
            code: null,
            message: null
        })
    } catch(err) {
        console.log(err)
        dbConn.rollback();
        res.send({
            code: 201,
            message: 'SQL语句出错啦~~~',
        })
    }
});
