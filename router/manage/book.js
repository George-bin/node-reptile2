const router = require("./index.js");
//引入数据模型模块
const model = require("./model");
const {
	Catalog,
	SectionContent,
	Book,
	Classify,
} = model;

// 获取小说列表（概览）
router.get('/list/base', function (req, res, next) {
	console.log('session-list', req.session)
	Classify.find({}, function (err, classifyList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '获取分类失败!'
			});
		}
		classifyList = JSON.parse(JSON.stringify(classifyList))
		Book.find({}, function (err, bookList) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '获取小说列表失败!'
				});
			}
			classifyList.forEach(classify => {
				let list = [];
				bookList.forEach(book => {
					if (classify.classifyId === book.classify) {
						list.push(book);
					}
				})
				classify.bookList = list.slice(0, 3);
			})
			res.send({
				errcode: 0,
				message: '获取分类成功!',
				classifyList
			})
		})
	})
});

// 根据分类id获取小说列表
router.get('/list/:classifyId', function (req, res, next) {
	let {
		classifyId
	} = req.params;
	if (classifyId === 'all') {
		Book.find({}, function (err, bookList) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '查询数据库失败!'
				});
			}
			res.send({
				errcode: 0,
				message: '获取小说列表成功!',
				bookList
			});
		});
	} else {
		Book.find({
			classify: classifyId
		}, function (err, bookList) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '查询数据库失败!'
				});
			}
			res.send({
				errcode: 0,
				message: '获取小说列表成功!',
				bookList
			});
		});
	}
});

// 上传书籍封面
router.post('/upload/img', function (req, res, next) {
	console.log('上传图片')
	// console.log(req.body)
	// console.log(__dirname)
	let {
		oldFilePath
	} = req.body;
	// console.log(req.files[0])
	let mimetype = req.files[0].mimetype.split('/')[1];
	let filename = `${Date.now()}${parseInt((Math.random() + 1) * 10000)}.${mimetype}`;
	let filePath = `${serverConfig.upload_path}/images/bookcover/${filename}`;
	console.log("filePath：",filePath)
	fs.readFile(req.files[0].path, function (err, data) {
		if (err) {
			res.send({
				errcode: 996,
				message: '上传失败!'
			})
		} else {
			fs.writeFile(filePath, data, function (err) {
				if (err) {
					// console.log(`写入文件失败:${filePath}`)
					// console.log(err)
					return res.send({
						errcode: 996,
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
				// if (oldFilePath) {
				// 	oldFilePath = oldFilePath.split('/file/')[1]
				// 	let oldFile = serverConfig.model === 'development' ? `/Users/george/Desktop/uploads/images/${oldFilePath}` : oldFilePath
				// 	fs.unlink(oldFile, (err) => {
				// 		if (err) {
				// 			console.log('删除文件失败2');
				// 			console.log(err)
				// 		}
				// 	});
				// }
				res.send({
					errcode: 0,
					message: '上传成功!',
					filePath: `http://${serverConfig.host}/file/uploads/images/bookcover/${filename}`
				})
			});
			// mac环境
			// fs.writeFile(`/Users/george/Desktop/uploads/images/bookcover/${filename}`, data, function(err) {
			// 	if (err) {
			// 		console.log(err)
			// 		return res.send({
			// 			errcode: 996,
			// 			message: '上传失败!'
			// 		});
			// 	}
			// 	// 删除元文件
			// 	fs.unlink(req.files[0].path, (err) => {
			// 		if (err) {
			// 			console.log('删除原文件失败!');
			// 			console.log(err)
			// 		}
			// 	});
			// 	// 删除之前上传的图片(重新上传)
			// 	res.send({
			// 		errcode: 0,
			// 		message: '上传成功!',
			// 		// filePath: `http://${serverConfig.host}:${serverConfig.port}/api/book/public/uploads/images/${filename}`
			// 		filePath: `http://${serverConfig.host}/file/images/bookcover/${filename}`
			// 	});
			// });
		}
	});
});

// 新增小说
router.post('/registerBook', function (req, res, next) {
	console.log(req.body)
	let {
		body
	} = req
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
				errcode: 999,
				message: '写入数据库失败!'
			});
		}
		res.send({
			errcode: 0,
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

// 更新小说信息
router.put('/', function (req, res, next) {
	console.log('更新')
	console.log(req.body)
	let {
		body
	} = req;
	Book.findOneAndUpdate({
		_id: body._id
	}, {
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
		label: body.label // 标签
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
});

// 删除小说
router.delete('/delete/:bookId', function (req, res, next) {
	let {
		params
	} = req;
	console.log(params);
	Book.deleteOne({
		bookId: params.bookId
	}, function (err, book) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '删除小说失败!'
			});
		}
		Catalog.deleteMany({
			bookId: params.bookId
		}, function (err, catalog) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '删除小说目录失败!'
				});
			}
			SectionContent.deleteMany({
				bookId: params.bookId
			}, function (err, content) {
				if (err) {
					return res.send({
						errcode: 999,
						message: '删除小说目录失败!'
					});
				}
				res.send({
					errcode: 0,
					message: '删除成功!'
				});
			})
		})
	})
});

// 条件筛选（分页处理）
router.get('/screen', function (req, res, next) {
	console.log(req.query)
	let {
		page,
		count,
		classifyId,
		labelId
	} = req.query;
	page = Number(page)-1;
    count = Number(count);

    Book.find({}, function (err, bookList) {
        if (err) {
            return res.send({
                errcode: 999,
                message: '查询book数据库失败!'
            });
        }
        let result = JSON.parse(JSON.stringify(bookList));
        if (classifyId !== 'all') {
            result = bookList.filter(item => {
                return item.classify = classifyId
            });
        }

        if (labelId !== 'all') {
            result = result.filter(item => {
                return item.label.findIndex(item => item === labelId) > -1
            });
        }

        res.send({
            errcode: 0,
            message: '获取小说列表成功!',
            page,
            count,
            bookList: result.slice(page*count, page*count+count)
        });  
    })
});

// 获取书籍信息by id
router.get('/info/:bookId', function (req, res, next) {
	let {
		bookId
	} = req.params;
	Book.findOne({ _id: bookId }, function (err, book) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '获取书籍信息成功!'
			});
		}
		res.send({
			errcode: 0,
			message: '获取书籍信息成功!',
			bookInfo: book
		});
	});
});