const path = require("path");
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
// const RedisStore = require('connect-redis')(session);
const serverConfig = require("./config");
const multer = require("multer");
const storage = multer.diskStorage({
  // destination: 'D:\\public\\uploads\\'+ new Date().getFullYear() + (new Date().getMonth()+1) + new Date().getDate()
  destination:
    serverConfig.model === "production" ? "/public/uploads/" : `‎/⁨Macintosh HD⁩/⁨用户⁩/⁨george/⁨文稿/public⁩`
});
// 设置保存上传文件路径
const upload = multer({ storage });

const app = express();
// 使用express-session中间件
app.use(
  session({
    // cookie的名字（也可以设为key）
    name: "usr",
    // 私钥（用于对sessionID的cookie进行签名）
    secret: "sysuygm",
    cookie: {
      // session的过期时间
      maxAge: 2 * 60 * 60 * 1000,
      httpOnly: false
    },
    resave: false,
    saveUninitialized: false
  })
);

app.use(bodyParser.json());
app.use(upload.any());

let cors = serverConfig.cors;
app.all("*", (req, res, next) => {
  console.log(req.headers.origin)
  let ol = cors.split(',')
  if (ol.includes(req.headers.origin) >= 0) {
  	res.header("Access-Control-Allow-Origin", req.headers.origin);
  	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  	res.header("Access-Control-Allow-Headers","Content-Type");
  	res.header("Content-Type", "application/json;charset=utf-8");
  	res.header("Access-Control-Allow-Credentials", true);
  }

  // res.header("Access-Control-Allow-Origin", req.headers.origin);
  // res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  // res.header("Access-Control-Allow-Headers","Content-Type");
  // res.header("Content-Type", "application/json;charset=utf-8");
  // res.header("Access-Control-Allow-Credentials", true);
  next();
});

// 数据库 start
const mongoose = require("mongoose");
// 连接数据库（vueData为数据库的名字）
mongoose.connect("mongodb://localhost:27017/book_data_base", {
  useNewUrlParser: true
});
// connect()返回一个状态待定（pending）的接连，接着加上成功提醒和失败警告；
mongoose.connection.on("error", console.error.bind(console, "数据库连接失败!"));
mongoose.connection.once("open", function() {
  console.log("数据库连接成功!");
});
mongoose.connection.on("disconnected", function() {
  console.log("数据库断开!");
});
// 数据库 end

// 路由
const fictionRouter = require("./router/fiction");
// 小说路由
app.use("/api/book/", fictionRouter);

app.use(express.static(path.join(__dirname, "public")));

// 小说爬虫
require('./utils/book-reptile');

// app.get('/', async function(req, res, next) {
// 	res.send('success');
// });

module.exports = app;
