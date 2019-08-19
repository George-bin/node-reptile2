// 引入express模块
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
//定义路由级中间件
const router = express.Router();
const serverConfig = require('../../config');
//引入数据模型模块
const model = require("./model");
const Catalog = model.Catalog;
const SectionContent = model.SectionContent;
const Book = model.Book;

// 状态码（errcode）
// 999：操作数据库失败
// 998：抱歉，本站尚未收录此书!
// 997：该章节不存在
// 996：上传文件失败
// 0：正常访问

// 获取小说列表
router.get('/list', function(req, res, next) {
	console.log(req.session.username)
	// let { classify } = req.query;
	Book.find({}, function(err, bookList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			})
		}

		// 所有分类
		let allClassify = [];
		bookList.forEach(item => {
			if (!allClassify.includes(item.classify)) {
				allClassify.push(item.classify)
			}
		});

		// 所有分类信息
		let classifyList = [];
		allClassify.forEach(classifyName => {
			let obj = {
				classifyName,
				bookList: []
			};
			bookList.forEach(book => {
				if (classifyName === book.classify) {
					obj.bookList.push(book)
				}
			});
			classifyList.push(obj);
		})

		res.send({
			errcode: 0,
			message: '获取小说列表成功!',
			classifyList
		});
	})
})

// 小程序-获取openid
router.post('/getOpenid', function (req, res, next) {
	// appid: wx87fc79ea9b023224
	// secret: e6299f3b30b964ec41b1ed57d9daabd4
	let { code } = req.body;
	https.get(`https://api.weixin.qq.com/sns/jscode2session?appid=wx87fc79ea9b023224&secret=e6299f3b30b964ec41b1ed57d9daabd4&js_code=${code}&grant_type=authorization_code`, function (res2) {
		let chunks = ''
		res2.on('data', function (chunk) {
			chunks += chunk;
		});
		res2.on('end', function () {
			chunks = JSON.parse(chunks);
			console.log(chunks.openid)
			// 设置session
			req.session.username = chunks.openid;
			console.log(req.session)
			res.send(chunks)
		});
	})
});

// 获取小说目录
router.get('/catalog/:bookId', function(req, res, next) {
	// console.log(req.params.bookId)
	Catalog.find({
		bookId: req.params.bookId
	}, function(err, catalogData) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			});
		}
		if (catalogData.length) {
			res.send({
				errcode: 0,
				message: '获取目录成功!',
				catalogData
			});
		} else {
			res.send({
				errcode: 998,
				message: '抱歉，本站尚未收录此书!'
			});
		}
	})
})

// 获取小说章节内容
router.get('/content/:bookId/:sectionId', function(req, res, next) {
	SectionContent.find({
		bookId: req.params.bookId,
		sectionId: req.params.sectionId
	}, function(err, content) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			});
		}
		if (content.length) {
			res.send({
				errcode: 0,
				message: '获取章节内容成功!',
				section: content[0]
			});
		} else {
			res.send({
				errcode: 997,
				message: '该章节不存在!',
			});
		}
	})
})

// 返回图片
router.get('/public/uploads/images/*', function (req, res) {
	console.log(req.url)
	res.header('Content-Type', 'image/jpeg')
	res.sendFile(path.join(__dirname, `../../${req.url}`));
})

// 上传书籍封面
router.post('/uploadfile/bookCover', function (req, res, next) {
	// console.log(req.files[0])
	console.log(req.body)
	console.log(__dirname)
	let { oldFilePath } = req.body;
	let mimetype = req.files[0].mimetype.split('/')[1];
	let filename = `${Date.now()}${parseInt((Math.random() + 1) * 10000)}.${mimetype}`;
	let filePath =  path.join(__dirname, `../../public/uploads/images/${filename}`) ;
	console.log(filePath)
	fs.readFile(req.files[0].path, function (err, data) {
		if (err) {
			res.send({
				errCode: 996,
				message: '上传失败!'
			})
		} else {
			fs.writeFile(filePath, data, function (err) {
				console.log(`写入文件:${req.files[0].path}`)
				if (err) {
					console.log(err)
					return res.send({
						errCode: 996,
						message: '上传失败!'
					})
				}
				// 删除元文件
				fs.unlink(req.files[0].path, (err) => {
					if (err) {
						console.log('删除文件失败1');
						console.log(err)
					}
				});
				// 删除之前上传的图片（重新上传）
				if (oldFilePath) {
					oldFilePath = oldFilePath.split('book/')[1]
					fs.unlink(path.join(__dirname, `../../${oldFilePath}`), (err) => {
						if (err) {
							console.log('删除文件失败2');
							console.log(err)
						}
					});
				}
				res.send({
					errCode: 0,
					message: '上传成功!',
					filePath: `http://${serverConfig.host}:${serverConfig.port}/api/book/public/uploads/images/${filename}`
				})
			})
		}
	})
})

// 注册小说
router.post('/registerBook', function (req, res, next) {
	console.log(req.body)
	let { body } = req
	let bookInfo = new Book({
    classify: body.classify, // 分类
    bookId: body.bookId, // 书id
    bookName: body.bookName, // 书名
    bookCover: body.bookCover, // 图片
    sectionCount: body.sectionCount, // 章节数
    bookIntro: body.bookIntro, // 简介
    author: body.author, // 作者
    popularityIndex: body.popularityIndex, // 人气指数
    grade: body.grade, // 评分
    like: body.like, // 点赞
    label: JSON.stringify(body.label) // 标签
	})
	bookInfo.save((err, book) => {
		if (err) {
			return res.send({
				errCode: 999,
				message: '写入数据库失败!'
			})
		}
		res.send({
			errCode: 0,
			message: '写入数据库成功!',
			bookInfo: {
				classify: body.classify, // 分类
				bookId: body.bookId, // 书id
				bookName: body.bookName, // 书名
				bookCover: body.bookCover, // 图片
				sectionCount: body.sectionCount, // 章节数
				bookIntro: body.bookIntro, // 简介
				author: body.author, // 作者
				popularityIndex: body.popularityIndex, // 人气指数
				grade: body.grade, // 评分
				like: body.like, // 点赞
				label: JSON.stringify(body.label) // 标签
			}
		})
	})
})

// 更新小说基本信息
router.put('/updateBookInfo', function (req, res, next) {
	console.log('更新')
	console.log(req.body)
	let { body } = req;
	Book.findOneAndUpdate({ _id: body._id }, {
		classify: body.classify, // 分类
		bookId: body.bookId, // 书id
		bookName: body.bookName, // 书名
		bookCover: body.bookCover, // 图片
		sectionCount: body.sectionCount, // 章节数
		bookIntro: body.bookIntro, // 简介
		author: body.author, // 作者
		popularityIndex: body.popularityIndex, // 人气指数
		grade: body.grade, // 评分
		like: body.like, // 点赞
		label: JSON.stringify(body.label) // 标签
	}, {}, (err, doc) => {
		if (err) {
			return res.send({
				errcode: 999,
				message: '更新数据失败!'
			})
		}
		res.send({
			errcode: 0,
			message: '更新数据成功!'
		})
	})
})

module.exports = router;
