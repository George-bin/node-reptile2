const path = require("path");
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
// const RedisStore = require('connect-redis')(session);
const serverConfig = require("./config");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: serverConfig.upload_path
});
// 设置保存上传文件路径
const upload = multer({
  storage
});

const app = express();
// 使用express-session中间件
app.use(
  session({
    // cookie的名字（也可以设为key）
    name: "usr",
    // 私钥（用于对sessionID的cookie进行签名）
    secret: "{sb}{123}?az+q",
    cookie: {
      // path: "/",
      // session的过期时间
      maxAge: 2 * 60 * 60 * 1000,
      httpOnly: true
    },
    resave: false,
    saveUninitialized: false
  })
);
// 每次请求，刷新session的过期时间
app.use(function(req, res, next) {
  req.session._garbage = Date();
  req.session.touch();
  next();
});
app.use(bodyParser.json());
// 上传文件
app.use(upload.any());

// 无权限认证的api
let authApiList = [
  '/api/book/list/base',
  '/api/book/auth',
  '/api/book/manage/login',
  '/api/book/list/base',
  '/api/book/wx/login',
  '/api/book/wx/getOpenid',
  '/api/book/upload/img'
];
app.all("*", (req, res, next) => {
  // console.log(req.headers.origin)
  // if (ol.includes(req.headers.origin) >= 0) {
  // 	res.header("Access-Control-Allow-Origin", req.headers.origin);
  // 	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  // 	res.header("Access-Control-Allow-Headers","Content-Type");
  // 	res.header("Content-Type", "application/json;charset=utf-8");
  // 	res.header("Access-Control-Allow-Credentials", true);
  // }

  // res.header("Access-Control-Allow-Origin", req.headers.origin);
  // res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  // res.header("Access-Control-Allow-Headers","Content-Type");
  // res.header("Content-Type", "application/json;charset=utf-8");
  // res.header("Access-Control-Allow-Credentials", true);

  next();
  // console.log(req.session);
  // if (authApiList.indexOf(req.url) > -1) {
  //   next();
  // } else {
  //   let { client } = req.session;
  //   console.log(req.url)
  //   console.log(req.session)
  //   if (client && client.isAuth) {
  //     next();
  //   } else {
  //     res.send({
  //       errcode: 991,
  //       message: '登录态失效!'
  //     });
  //   }
  // }
});

// 数据库 start
// const mongoose = require("mongoose");
// 连接数据库
// mongoose.connect(serverConfig.db_url, {
//   useNewUrlParser: true
// });
// connect()返回一个状态待定（pending）的接连，接着加上成功提醒和失败警告；
// mongoose.connection.on("error", console.error.bind(console, "数据库连接失败!"));
// mongoose.connection.once("open", function () {
//   console.log("数据库连接成功!");
// });
// mongoose.connection.on("disconnected", function () {
//   console.log("数据库断开!");
// });
// 数据库 end

// 管理端（路由）
// const manage = require("./router/manage");
// app.use("/api/book/", manage);

const mysql = require('./router/mysql');
app.use("/api/book/", mysql);

app.use(express.static(path.join(__dirname, "public")));

// 小说爬虫
// require('./utils/book-reptile');

// app.get('/', async function(req, res, next) {
// 	res.send('success');
// });

module.exports = app;
