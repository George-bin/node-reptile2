const router = require("./index.js");
const model = require("./model");
const {
	Book,
	Classify
} = model;

// 获取分类列表
router.get('/classify', function (req, res, next) {
	Classify.find({}, function (err, classifyList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '操作数据库失败!'
			});
		}
		classifyList = JSON.parse(JSON.stringify(classifyList));
		Book.find({}, function (err, bookList) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '获取小说列表失败!'
				});
			}
			classifyList.forEach(classify => {
				let count = 0;
				bookList.forEach(book => {
					if (classify._id === book.classify) {
						count += 1
					}
				});
				classify.bookCount = count;
			});
			res.send({
				errcode: 0,
				message: '获取分类成功!',
				classifyList
			});
		})
		
	})
	
});

// 根据id获取分类信息
router.get('/classify/:_id', function (req, res, next) {
	let {
		_id
	} = req.params;
	Classify.findOne({
		_id
	}, function (err, classify) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '获取分类失败!'
			});
		}
		Book.find({
			classify: classify.classifyId
		}, function (err, books) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '获取分类失败!'
				});
			}
			classify = JSON.parse(JSON.stringify(classify))
			res.send({
				errcode: 0,
				message: '获取分类信息成功!',
				classify: {
					...classify,
					bookCount: books.length
				}
			});
		})
	});
});

// 新增分类
router.post('/classify', function (req, res, next) {
	let {
		body
	} = req;
	body = JSON.parse(JSON.stringify(body));
	body.id = Date.now().toString();
	let { classifyName } = body
	Classify.find({
		classifyName
	}, function (err, classifyList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			});
		}
		if (classifyList.length > 0) {
			return res.send({
				errcode: 888,
				message: '该分类已存在，请勿重复添加!'
			});
		} else {
			let classify = new Classify({
				...body,
				createTime: new Date(),
				updateTime: new Date()
			})
			classify.save((err, classify) => {
				if (err) {
					return res.send({
						errcode: 999,
						message: '写入数据库失败!'
					});
				}
				res.send({
					errcode: 0,
					message: '新增分类成功!'
				});
			});
		}
	});
});

// 更新分类
router.put('/classify', function (req, res, next) {
	let {
		_id
	} = req.body;
	let c = JSON.parse(JSON.stringify(req.body));
	delete c._id;

	Classify.update({
		_id
	}, {
		...c,
		updateTime: new Date()
	}, function (err, res) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '更新分类失败!'
			})
		}
	})

	res.send({
		errcode: 0,
		message: '更新分类成功!'
	})
});

// 删除分类
router.delete('/classify/:_id', function (req, res, next) {
	let { _id } = req.params;
	Classify.deleteOne({
		_id
	}, function (err, classify) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '从数据库删除分类失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '删除分类成功!',
			classify
		});
	});
});