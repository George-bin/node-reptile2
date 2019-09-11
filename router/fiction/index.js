// 引入express模块
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const md5 = require('md5-node');
//定义路由级中间件
const router = express.Router();
const serverConfig = require('../../config');
//引入数据模型模块
const model = require("./model");
const Catalog = model.Catalog;
const SectionContent = model.SectionContent;
const Book = model.Book;
const Classify = model.Classify;
const User = model.User;
const ManageUser = model.ManageUser;

// 状态码（errcode）
// 999：操作数据库失败
// 998：抱歉，本站尚未收录此书!
// 997：该章节不存在
// 996：上传文件失败
// 995：查询参数错误 => get
// 994：登录失败
// 0：正常访问

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
})

// 获取指定分类小说列表
router.get('/list/:classifyId', function(req, res, next) {
	let { classifyId } = req.params;
	Book.find({classify: classifyId}, function(err, bookList) {
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
	})
})

// 获取管理端用户列表
// router.get('/manage/list', function (req, res, next) {
// 	ManageUser.find({}, function (err, data) {
// 		res.send(data)
// 	})
// })

// 小说管理员登录
router.post('/manage/login', function (req, res, next) {
	let { body } = req;
	// console.log('请求信息')
	// console.log(body)
	ManageUser.find({ account: body.account, password: body.password }, function (err, manageUserList) {
		console.log(manageUserList)
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			})
		}
		if (manageUserList.length) {
			req.session.username = { account: body.account, password: body.password }
			return res.send({
				errcode: 0,
				message: '登录成功!'
			});
		} else {
			res.send({
				errcode: 994,
				message: '登录失败!'
			});
		}
	})
})

// 小程序登录-通过openid维护登录态
router.post('/wx/login', function (req, res, next) {
	// appid: wx87fc79ea9b023224
	// secret: e6299f3b30b964ec41b1ed57d9daabd4
	let { code } = req.body;
	let appId = 'wx87fc79ea9b023224'
	let secret = 'e6299f3b30b964ec41b1ed57d9daabd4'
	https.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`, function (res2) {
		let chunks = ''
		res2.on('data', function (chunk) {
			chunks += chunk;
		});
		res2.on('end', function () {
			chunks = JSON.parse(chunks);
			// 设置session
			req.session.username = chunks;
			res.send({
				errcode: 0,
				message: '登录成功!'
			})
		});
	})
});

// 获取树架信息
router.get('/bookrackInfo', function (req, res, next) {
	console.log('书架信息')
	console.log(req.session)
	res.send({
		errcode: 0,
		message: '获取书架信息成功!'
	})
})

// 获取小说目录 query => page: 页数 limit: 每次获取的数量
router.get('/catalog/:bookId', function(req, res, next) {
	console.log(req.session)
	// console.log(req.query)
	let { bookId } = req.params
	let { page, limit } = req.query
	// 爬取书籍
	if (page === 'all') {
		Catalog.find({
			bookId: bookId
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
	}, function(err, catalogData) {
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
				catalogData: catalogData.slice(page*limit, page*limit+limit)
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
// router.get('/public/uploads/images/*', function (req, res) {
// 	console.log(req.url)
// 	res.header('Content-Type', 'image/jpeg')
// 	res.sendFile(path.join(__dirname, `../../${req.url}`));
// })

// 上传书籍封面
router.post('/uploadfile/bookCover', function (req, res, next) {
	// console.log(req.files[0])
	console.log(req.body)
	console.log(__dirname)
	let { oldFilePath } = req.body;
	let mimetype = req.files[0].mimetype.split('/')[1];
	let filename = `${Date.now()}${parseInt((Math.random() + 1) * 10000)}.${mimetype}`;
	// let filePath =  path.join(__dirname, `../../public/uploads/images/${filename}`);
	let filePath =  `D:/public/uploads/images/${filename}`;
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
					oldFilePath = oldFilePath.split('/file/')[1]
					let oldFile = serverConfig.model === 'development' ? `D:/public/${oldFilePath}` : path.join(__dirname, `../../${oldFilePath}`)
					fs.unlink(oldFile, (err) => {
						if (err) {
							console.log('删除文件失败2');
							console.log(err)
						}
					});
				}
				res.send({
					errCode: 0,
					message: '上传成功!',
					// filePath: `http://${serverConfig.host}:${serverConfig.port}/api/book/public/uploads/images/${filename}`
					filePath: `http://${serverConfig.host}/file/uploads/images/${filename}`
				})
			})
		}
	})
})

// 新增小说
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
			});
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

// 删除小说
router.delete('/delete/:bookId', function (req, res, next) {
	let { params } = req;
	console.log(params);
	Book.deleteOne({bookId: params.bookId}, function (err, book) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '删除小说失败!'
			});
		}
		Catalog.deleteMany({bookId: params.bookId}, function (err, catalog) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '删除小说目录失败!'
				});
			}
			SectionContent.deleteMany({bookId: params.bookId}, function (err, content) {
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
})

// 获取分类
router.get('/classifyList', function (req, res, next) {
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
				let count = 0;
				bookList.forEach(book => {
					if (classify.classifyId === book.classify) {
						count += 1
					}
				})
				classify.classifyBookCount = count;
			})
			res.send({
				errcode: 0,
				message: '获取分类成功!',
				classifyList
			})
		})
	})
})

// 新增分类
router.post('/registerClassify', function (req, res, next) {
  let { body } = req;
  let classify = new Classify({
    ...body
  })
  classify.save((err, classify) => {
    if (err) {
      return res.send({
        errCode: 999,
        message: '写入数据库失败!'
      });
    }
    res.send({
      errCode: 0,
      message: '新增分类成功!'
    });
  })
})

// 更新分类
router.put('/updateClassify', function (req, res, next) {
  let { body } = req
  Classify.update({ _id: body._id }, {
    classifyId: body.classifyId,
    classifyName: body.classifyName
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
})

// 获取用户列表
router.get('/getUserList', function (req, res, next) {
	User.find({}, function (err, userList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '读取数据库失败!'
			})
		}
		res.send({
			errcode: 0,
			message: '获取用户列表成功!',
			userList
		})
	})
})

// 新增用户
router.post('/registerUser', function (req, res, next) {
	let { body } = req
	console.log(body)
	let user = new User({
		...body
	})

	user.save((err, classify) => {
		if (err) {
			return res.send({
				errCode: 999,
				message: '写入数据库失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '新增用户成功!'
		});
	})

})

module.exports = router;
