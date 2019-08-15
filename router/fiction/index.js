// 引入express模块
const express = require('express');
//定义路由级中间件
const router = express.Router();
//引入数据模型模块
const model = require("./model");
const Catalog = model.Catalog;
const SectionContent = model.SectionContent;
const bookList = model.bookList

// 状态码（errcode）
// 999：操作数据库失败
// 998：抱歉，本站尚未收录此书!
// 997：该章节不存在
// 0：正常访问

// 获取小说列表
router.get('/list', function(req, res, next) {
	bookList.find({}, function(err, bookList) {
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

module.exports = router;