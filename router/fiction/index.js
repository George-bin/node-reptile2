// 引入express模块
const express = require('express');
const fs = require('fs');
//定义路由级中间件
const router = express.Router();
//引入数据模型模块
const model = require("./model");
const Catalog = model.Catalog;
const SectionContent = model.SectionContent;
const Book = model.Book

// 状态码（errcode）
// 999：操作数据库失败
// 998：抱歉，本站尚未收录此书!
// 997：该章节不存在
// 996：上传文件失败
// 0：正常访问

// 获取小说列表
router.get('/list', function(req, res, next) {
	Book.find({}, function(err, bookList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			})
		}
		res.send({
			errcode: 0,
			message: '获取小说列表成功!',
			bookList
		});
	})
})

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
				content
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
	console.log()
	console.log(req)
	// res.sendFile( __dirname + "/" + req.url );
	res.sendFile(  "D:/" + req.url );
})

// 上传文件
router.post('/uploadfile/:bookId', function (req, res, next) {
	console.log(req)
	// let filePath = `D:\\public\\uploads\\${new Date().getFullYear()}${new Date().getMonth()+1}${ new Date().getDate()}\\${req.files[0].originalname}`;
	let filePath = `D:\\public\\uploads\\images\\${req.files[0].originalname}`;
	fs.readFile(req.files[0].path, function (err, data) {
		if (err) {
			res.send({
				errCode: 996,
				message: '上传失败!'
			})
		} else {
			fs.writeFile(filePath, data, function (err) {
				if (err) {
					return res.send({
						errCode: 996,
						message: '上传失败!'
					})
				}
				// 删除元文件
				fs.unlink(req.files[0].path, (err) => {
					if (err) {
						console.log('删除文件失败');
					}
				});
				res.send({
					errCode: 0,
					message: '上传成功!',
					filePath
				})
			})
		}
	})
})

// 注册小说
router.post('/registerBook', function (req, res, next) {
	// let bookInfo = new Book({
	//
	// })
	console.log(req)
	res.send({
		errCode: 0,
		message: '注册成功!'
	})
})

module.exports = router;
