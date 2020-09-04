/*
 * @Author: your name
 * @Date: 2020-09-04 17:38:40
 * @LastEditTime: 2020-09-04 17:40:41
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-reptile\router\manage\catalog.js
 */
const router = require("./index.js");
//引入数据模型模块
const model = require("./model");
const {
	Catalog,
	SectionContent,
	Book,
	Classify,
} = model;

// 获取小说目录 query => page: 页数 limit: 每次获取的数量
router.get('/catalog/:bookId', function (req, res, next) {
	console.log(req.session)
	// console.log(req.query)
	let {
		bookId
	} = req.params;
	let {
		page,
		limit
	} = req.query;
	// 爬虫
	if (page === 'all') {
		Catalog.find({
			bookId: bookId
		}, function (err, catalogData) {
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
					catalogData: catalogData
				});
			} else {
				res.send({
					errcode: 998,
					message: '抱歉，本站尚未收录此书!'
				});
			}
		})
		return
	}
	// 查询参数不存在
	if (!page || !limit) {
		return res.send({
			errcode: 995,
			message: '查询参数错误!'
		});
	}
	Catalog.find({
		bookId: bookId
	}, function (err, catalogData) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			});
		}
		if (catalogData.length) {
			page = parseInt(page)
			limit = parseInt(limit)
			res.send({
				errcode: 0,
				message: '获取目录成功!',
				catalogData: catalogData.slice(page * limit, page * limit + limit)
			});
		} else {
			res.send({
				errcode: 998,
				message: '抱歉，本站尚未收录此书!'
			});
		}
	})
});