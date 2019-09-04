const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
// const RedisStore = require('connect-redis')(session);
const serverConfig = require('./config');
const multer = require('multer');
const storage = multer.diskStorage({
	// destination: 'D:\\public\\uploads\\'+ new Date().getFullYear() + (new Date().getMonth()+1) + new Date().getDate()
	// destination: path.join(__dirname, 'public')
	destination: `D:\\public`
});
// 设置保存上传文件路径
const upload = multer({storage})

const Nightmare = require('nightmare');          // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true });     // show:true  显示内置模拟浏览器


// cheerio相当于node版的jQuery，用过jQuery的同学会非常容易上手。它主要是用来获取抓取到的页面元素和其中的数据信息;
const cheerio = require('cheerio');
// 模块进行转码，中文显示正常后开始解析源码；
const iconv = require('iconv-lite');
//因为需要确保章节的顺序，所以这里引进 sync-request 模块进行同步 request 请求资源；
const request = require('sync-request');
// superagent是node里一个非常方便的、轻量的、渐进式的第三方客户端请求代理模块，用他来请求目标页面
const superagent = require('superagent');

const app = express();
// 使用session中间件
// app.use(session({
// 	store: new RedisStore({
// 		host: "192.168.142.138",
// 		port: 6379,
// 		db: "0"
// 	}),
// 	secret: 'this is string key',   // 可以随便写。 一个 String 类型的字符串，作为服务器端生成 session 的签名
// 	name: 'session_id',/*保存在本地cookie的一个名字 默认connect.sid  可以不设置*/
// 	resave: false,   /*强制保存 session 即使它并没有变化,。默认为 true。建议设置成 false。*/
// 	saveUninitialized: true,   //强制将未初始化的 session 存储。  默认值是true  建议设置成true
// 	cookie: {
// 		maxAge: 5000    /*过期时间*/
// 	},   /*secure https这样的情况才可以访问cookie*/
// 	//设置过期时间比如是30分钟，只要游览页面，30分钟没有操作的话在过期
// 	rolling: true //在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false）
// }));

app.use(bodyParser.json())
app.use(upload.any())

let cors = serverConfig.cors;
app.all('*', (req, res, next) => {
	let ol = cors.split(',')
	if (ol.includes(req.headers.origin) >= 0) {
		res.header("Access-Control-Allow-Origin", req.headers.origin);
		res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
		res.header("Access-Control-Allow-Headers","Content-Type");
		res.header("Content-Type", "application/json;charset=utf-8");
		res.header("Access-Control-Allow-Credentials", true);
	}
	console.log('sessionId', req.headers.sessionid)
	console.log('session', req.session)
	// if (req.session)
	next();
});

// 数据库 start
const mongoose = require('mongoose');
// 连接数据库（vueData为数据库的名字）
mongoose.connect('mongodb://localhost:27017/ReptileData');
// connect()返回一个状态待定（pending）的接连，接着加上成功提醒和失败警告；
mongoose.connection.on('error', console.error.bind(console, '数据库连接失败!'));
mongoose.connection.once('open', function() {
	console.log('数据库连接成功!');
});
mongoose.connection.on('disconnected', function() {
	console.log('数据库断开!');
});
// 数据库 end

const model = require("./router/fiction/model");
const Catalog = model.Catalog;
const SectionContent = model.SectionContent;

// 路由
const fictionRouter = require('./router/fiction');
// 小说路由
app.use('/api/book/', fictionRouter);
app.use(express.static(path.join(__dirname, 'public')));

let url = 'https://m.23us23us.com/68/68397/';
// getCatalog({
// 	url,
// 	bookId: 30,
// 	bookName: '林青的幸福生活',
// 	author: '春天'
// });
// 获取小说目录
let catalog = [];

function getCatalog({url, bookId, bookName, author}) {
	https.get(url, function(res) {
		let chunks = [];
		res.on('data', function(chunk) {
			console.log('数据进来啦!');
			chunks.push(chunk);
		});
		res.on('end', function() {
			console.log('数据接收完成!')
			// 转码操作
			// var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
			var html = iconv.decode(Buffer.concat(chunks), 'utf-8');
			var $ = cheerio.load(html, {
				// 如果设置为true，将对文档中的实体进行解码。默认为false。
				decodeEntities: false
			});
			// $('.chapterNum li a').each((idx, ele) => {
			// 	let catalog = new Catalog({
			// 		bookId: bookId,
			// 		bookName: bookName,
			// 		author: author,
			// 		title: $(ele).text(),
			// 		url: $(ele).attr('href'),
			// 		sectionId: idx.toString().padStart(6, '0')
			// 	});
			// 	catalog.save(function(err, data) {
			// 		if (err) return console.log(err);
			// 	})
			// });

			// 全本小说
			// $('#main .chapterlist dd:nth-child(n+11) a').each((idx, ele) => {
			// 	console.log('啦啦啦')
			// 	let catalog = new Catalog({
			// 		bookId: bookId,
			// 		bookName: bookName,
			// 		author: author,
			// 		title: $(ele).text(),
			// 		url: 'https://www.quanben.net'+$(ele).attr('href'),
			// 		sectionId: idx.toString().padStart(6, '0')
			// 	});
			// 	catalog.save(function(err, data) {
			// 		if (err) return console.log(err);
			// 	})
			// });

			// 66小说网
			$('.chapters li:nth-child(n+2) a').each((idx, ele) => {
				console.log('啦啦啦')
				let catalog = new Catalog({
					bookId: bookId,
					bookName: bookName,
					author: author,
					title: $(ele).text(),
					url: $(ele).attr('href'),
					sectionId: idx.toString().padStart(6, '0')
				});
				catalog.save(function(err, data) {
					if (err) return console.log(err);
				})
			});
		});
	}).on('error', function() {
		console.log('获取小说目录失败!')
	});
}

// 获取章节内容
function getSectionContent({
	url,
	bookId,
	title,
	sectionId,
	bookName,
	author
}) {
	let sectionInfo = '';
	http.get(url, function(res) {
		let chunks = [];
		res.on('data', function(chunk) {
			console.log('数据进来啦!');
			chunks.push(chunk)
		});
		res.on('end', function() {
			console.log('数据接收完成!')
			// 转码操作
			// var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
			var html = iconv.decode(Buffer.concat(chunks), 'utf-8');
			var $ = cheerio.load(html, {
				// 如果设置为true，将对文档中的实体进行解码。默认为false。
				decodeEntities: true
			});
			// sectionInfo = $('#content').text();
			// sectionInfo = $('#booktext').text();
			sectionInfo = $('.content').text();
			let sectionContent = new SectionContent({
				bookId: bookId,
				bookName: bookName, // 书名
				author: author, // 作者
				title: title,
				sectionId: sectionId,
				content: sectionInfo
			});
			sectionContent.save(function(err, data) {
				if (err) return console.log(err);
			})
			return sectionInfo;
		});
	}).on('error', function() {
		console.log('获取章节内容失败!')
		return 'fail';
	});
}

// 保存至数据库
function saveDatabase(url) {
	http.get(url, function(res) {
		let chunks = '';
		res.on('data', function(chunk) {
			chunks += chunk;
		});
		res.on('end', function() {
			let catalogs = JSON.parse(chunks).catalogData;
			catalogs.forEach((item, index) => {
				setTimeout(() => {
					getSectionContent({
						url: item.url,
						bookId: item.bookId,
						title: item.title,
						sectionId: item.sectionId,
						bookName: item.bookName, // 书名
						author: item.author // 作者
					})
				}, 1000 * index)
			})
		})
	})
}

// 完善章节（避免漏掉）
function aviodMissingSection (url) {
	http.get(url, function(res) {
		let chunks = '';
		res.on('data', function(chunk) {
			console.log('数据进来啦')
			chunks += chunk;
		});
		res.on('end', function() {
			console.log('数据接收完成')
			let catalogs = JSON.parse(chunks).catalogData;

			catalogs.forEach((item, index) => {
				console.log(item.bookName)
				setTimeout(() => {
					http.get(`http://localhost:3000/api/book/content/${item.bookId}/${item.sectionId}`, function (res2) {
						let data = '';
						res2.on('data', function(chunk) {
							// console.log('数据进来啦')
							data += chunk;
						});
						res2.on('end', function () {
							console.log(data)
							data = JSON.parse(data)
							if (data.errcode !== 0) {
								getSectionContent({
									url: item.url,
									bookId: item.bookId,
									title: item.title,
									sectionId: item.sectionId,
									bookName: item.bookName, // 书名
									author: item.author, // 作者
								})
							}
						})
					})
				}, 50 * index)
			})
		})
	})
}
// aviodMissingSection('http://localhost:3000/api/book/catalog/36?page=all')

// saveDatabase('http://localhost:3000/api/book/catalog/30?page=all')


app.get('/', async function(req, res, next) {
	res.send('success');
});

module.exports = app;
