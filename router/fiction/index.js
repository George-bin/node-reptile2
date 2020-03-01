// 引入express模块
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const os = require("os");
//定义路由级中间件
const router = express.Router();
const serverConfig = require('../../config');
//引入数据模型模块
const model = require("./model");
const {
	Catalog,
	Catalog2,
	SectionContent,
	Book,
	Classify,
	Label,
	User,
	ManageUser
} = model;

// 状态码（errcode）
// 999：操作数据库失败
// 998：抱歉，本站尚未收录此书!
// 997：该章节不存在
// 996：上传文件失败
// 995：查询参数错误 => get
// 994：登录失败
// 993: 用户不存在
// 992: 密码错误
// 991: 服务器session失效
// 990: 退出登录失败
// 889: 当前书籍已经加入书架
// 888: 存在相同数据

// 数据同步
// 10001: 本地爬虫数据库中不存在该书籍信息

// 鉴权
// 1: 鉴权失败
// 0：正常访问(按预期流程进行)

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

// 获取管理端用户列表
// router.get('/manage/list', function (req, res, next) {
// 	ManageUser.find({}, function (err, data) {
// 		res.send(data)
// 	})
// })

// 用户鉴权
router.get('/auth', function(req, res, next) {
	let {
		client
	} = req.session;
	// console.log(client)
	if (client && client.isAuth) {
		res.send({
			errcode: 0,
			message: '鉴权成功!'
		});
	} else {
		res.send({
			errcode: 1,
			message: '鉴权失败!'
		});
	}
});

// 小说管理员登录
router.post('/manage/login', function (req, res, next) {
	let {
		body
	} = req;
	// console.log('请求信息')
	// console.log(body)
	ManageUser.findOne({
		account: body.account,
		password: body.password
	}, function (err, user) {
		console.log(user)
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			})
		}
		if (user) {
			req.session.client = {
				isAuth: true,
				account: body.account
			}
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
});

// 小说管理员注销
router.get('/manage/logout', function (req, res, next) {
	if (req.session) {
		req.session.destroy(function (err) {
			if (err) {
				return res.send({
					errcode: 990,
					message: '退出登录失败!'
				});
			}
			res.send({
				errcode: 0,
				message: '退出登录成功!'
			});
		})
	} else {
		res.send({
			errcode: 0,
			message: '退出登录成功!'
		});
	}
});

// 小程序-通过openid维护登录态
router.post('/wx/getOpenid', function (req, res, next) {
	// appid: wx87fc79ea9b023224
	// secret: e6299f3b30b964ec41b1ed57d9daabd4
	let {
		code
	} = req.body;
	let appId = 'wx87fc79ea9b023224'
	let secret = 'e6299f3b30b964ec41b1ed57d9daabd4'
	https.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`, function (res2) {
		let chunks = ''
		res2.on('data', function (chunk) {
			chunks += chunk;
		});
		res2.on('end', function () {
			chunks = JSON.parse(chunks);
			console.log('chunks')
			console.log(chunks)
			// 设置session
			req.session.client = chunks;
			res.send({
				errcode: 0,
				message: '获取openid成功!'
			})
		});
	})
});

// 小程序-登录
router.post('/wx/login', function (req, res, next) {
	// console.log(req.session)
	let {
		client
	} = req.session;
	let {
		body
	} = req;
	// session失效
	if (!client) {
		return res.send({
			errcode: 991,
			message: '微信服务器登录态失效，请更新微信登录态!'
		})
	}
	User.findOne({
		account: body.account
	}, (err, user) => {
		// console.log(body)
		// console.log(user)
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询用户失败!'
			})
		}
		if (user) {
			if (body.password === user.password) {
				// 同步微信用户信息
				if (!user.openid) {
					User.findOneAndUpdate({
						account: body.account
					}, {
						openid: client.openid,
						username: body.username,
						avatarUrl: body.avatarUrl
					}, (err, data) => {
						if (err) {
							return res.send({
								errcode: 999,
								message: 'openid写入数据库失败!'
							})
						}
						req.session.client = {
							...req.session.client,
							isAuth: true,
							account: body.account
						}
						res.send({
							errcode: 0,
							message: '登录成功!',
							client: {
								account: user.account,
								// password: user.password,
								username: body.username,
								name: user.name,
								jurisdiction: user.jurisdiction,
								avatarUrl: body.avatarUrl
							}
						})
					})
				} else {
					req.session.client = {
						...req.session.client,
						isAuth: true,
						account: body.account
					}
					res.send({
						errcode: 0,
						message: '登录成功!',
						client: {
							account: user.account,
							// password: user.password,
							username: user.username,
							name: user.name,
							jurisdiction: user.jurisdiction,
							avatarUrl: user.avatarUrl
						}
					})
				}
			} else {
				res.send({
					errcode: 992,
					message: '密码错误!'
				})
			}
		} else {
			res.send({
				errcode: 993,
				message: '该用户不存在!'
			})
		}
	})
})

// 获取用户信息
router.get('/wx/getclient', function (req, res, next) {
	let {
		client
	} = req.session;
	if (!client) {
		return res.send({
			errcode: 991,
			message: '服务器登录态失效!'
		})
	}
	User.findOne({
		openid: client.openid
	}, function (err, user) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '获取用户信息失败!'
			});
		}
		if (!user) {
			return res.send({
				errcode: 993,
				message: '当前用户不存在!'
			});
		}
		delete user.bookIdList
		res.send({
			errcode: 0,
			message: '获取用户信息成功!',
			client: user
		});
	});
})

// 小程序-注销
router.post('/wx/logon', function (req, res, next) {
	console.log(req.session)
	if (req.session) {
		req.session.destroy(function (err) {
			if (err) {
				return res.send({
					errcode: 990,
					message: '退出登录失败!'
				});
			}
			res.send({
				errcode: 0,
				message: '退出登录成功!'
			});
		})
	}
});

// 获取书架信息
router.get('/bookrackInfo', function (req, res, next) {
	// console.log('书架信息')
	console.log(req.session)
	let {
		client
	} = req.session;
	if (!client) {
		return res.send({
			errcode: 0,
			message: '当前登录态已经失效!'
		})
	}
	User.findOne({
		openid: client.openid
	}, function (err, user) {
		console.log(user.bookIdList)
		let searchArr = [];
		user.bookIdList.forEach(item => {
			searchArr.push({
				bookId: item
			})
		})
		Book.find({
			$or: searchArr
		}, function (err, bookList) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '获取书架信息失败!'
				})
			}
			res.send({
				errcode: 0,
				message: '获取书架信息成功!',
				bookList
			});
		})
	});
});

// 获取小说目录 query => page: 页数 limit: 每次获取的数量
router.get('/catalog/:bookId', function (req, res, next) {
	console.log(req.session)
	// console.log(req.query)
	let {
		bookId
	} = req.params
	let {
		page,
		limit
	} = req.query
	// 爬取书籍
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

// 获取小说章节内容
router.get('/content/:bookId/:sectionId', function (req, res, next) {
	SectionContent.find({
		bookId: req.params.bookId,
		sectionId: req.params.sectionId
	}, function (err, content) {
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
});

// 返回图片
// router.get('/public/uploads/images/*', function (req, res) {
// 	console.log(req.url)
// 	res.header('Content-Type', 'image/jpeg')
// 	res.sendFile(path.join(__dirname, `../../${req.url}`));
// })

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
	let systemType = os.type();
	let filename = `${Date.now()}${parseInt((Math.random() + 1) * 10000)}.${mimetype}`;
	let filePath = serverConfig.model === 'production' ? `/home/public/uploads/images/bookcover/${filename}` : `‎/Users/george/Desktop/uploads/images/${filename}`;
	// console.log(filePath)
	fs.readFile(req.files[0].path, function (err, data) {
		if (err) {
			res.send({
				errcode: 996,
				message: '上传失败!'
			})
		} else {
			if (serverConfig.model === 'production' && systemType !== 'Darwin') {
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
						// filePath: `http://${serverConfig.host}:${serverConfig.port}/api/book/public/uploads/images/${filename}`
						filePath: `http://${serverConfig.host}/file/uploads/images/bookcover/${filename}`
					})
				});
			} else {
				fs.writeFile(`/Users/george/Desktop/uploads/images/bookcover/${filename}`, data, function(err) {
					if (err) {
						console.log(err)
						return res.send({
							errcode: 996,
							message: '上传失败!'
						});
					}
					// 删除元文件
					fs.unlink(req.files[0].path, (err) => {
						if (err) {
							console.log('删除原文件失败!');
							console.log(err)
						}
					});
					// 删除之前上传的图片(重新上传)
					res.send({
						errcode: 0,
						message: '上传成功!',
						// filePath: `http://${serverConfig.host}:${serverConfig.port}/api/book/public/uploads/images/${filename}`
						filePath: `http://${serverConfig.host}/file/images/bookcover/${filename}`
					});
				});
			}
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
	page = Number(page)-1
	count = Number(count)
	if (classifyId === 'all') {
		Book.find({}, function (err, bookList) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '查询book数据库失败!'
				});
			}
			if (labelId === 'all') {
				res.send({
					errcode: 0,
					message: '获取小说列表成功!',
					page,
					count,
					counts: bookList.length,
					bookList: bookList.slice(page*count, page*count+count)
				});
			} else {
				let result = []
				bookList.forEach(item => {
					let index = item.label.findIndex(item => item === labelId)
					if (index > -1) {
						result.push(JSON.parse(JSON.stringify(item)))
					}
				});
				res.send({
					errcode: 0,
					message: '获取小说列表成功!',
					page,
					count,
					counts: result.length,
					bookList: result.slice(page*count, page*count+count)
				});
			}
		});
	} else {
		Book.find({
			classify: classifyId
		}, function (err, bookList) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '查询book数据库失败!'
				});
			}
			if (labelId === 'all') {
				res.send({
					errcode: 0,
					message: '获取小说列表成功!',
					page,
					count,
					counts: bookList.length,
					bookList: bookList.slice(page*count, page*count+count)
				});
			} else {
				let result = []
				bookList.forEach(item => {
					let index = item.label.findIndex(item => item === labelId)
					if (index > -1) {
						result.push(JSON.parse(JSON.stringify(item)))
					}
				});
				res.send({
					errcode: 0,
					message: '获取小说列表成功!',
					page,
					count,
					counts: result.length,
					bookList: result.slice(page*count, page*count+count)
				});
			}
		});
	}
});

// 获取分类列表
router.get('/classify', function (req, res, next) {
	Classify.find({}, function (err, classifyList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '操作数据库失败!'
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
					if (classify.id === book.classify) {
						count += 1
					}
				})
				classify.bookCount = count;
			})
			res.send({
				errcode: 0,
				message: '获取分类成功!',
				classifyList
			})
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
	let { name } = body
	Classify.find({
		name
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
		body
	} = req
	Classify.update({
		_id: body._id
	}, {
		updateTime: new Date(),
		name: body.name
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

// 获取标签
router.get('/label', function (req, res, next) {
	Label.find({}, function (err, labelList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '操作数据库失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '获取标签列表成功!',
			labelList
		});
	});
});

// 获取标签详细信息
router.get('/label/:_id', function (req, res, next) {
	let { _id } = req.params;
	Label.findOne({_id}, function (err, label) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '操作数据库失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '获取标签信息成功!',
			label
		});
	});
});

// 新增标签
router.post('/label', function (req, res, next) {
	let {
		body
	} = req;
	body = JSON.parse(JSON.stringify(body));
	body.id = Date.now().toString() + parseInt(Math.random()*10000);
	let label = new Label({
		...body,
		createTime: new Date(),
		updateTime: new Date()
	})
	label.save((err, label) => {
		if (err) {
			return res.send({
				errcode: 999,
				message: '写入数据库失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '新增标签成功!',
			label
		});
	});
});

// 删除标签
router.delete('/label/:_id', function (req, res, next) {
	let { _id } = req.params;
	Label.deleteOne({
		_id
	}, function (err, label) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '从数据库删除标签失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '删除标签成功!',
			label
		})
	})
});

// 更新标签信息
router.put('/label/:_id', function (req, res, next) {
	let { _id } = req.params;
	let {
		body
	} = req;
	Label.update({_id}, {
		name: body.name,
		updateTime: new Date()
	}, function (err, label) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '操作数据库失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '更新标签成功!',
			label
		});
	});
});

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
});

// 新增用户
router.post('/registerUser', function (req, res, next) {
	let {
		body
	} = req
	console.log(body)
	let user = new User({
		...body
	});

	user.save((err, classify) => {
		if (err) {
			return res.send({
				errcode: 999,
				message: '写入数据库失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '新增用户成功!'
		});
	})
})

// 删除用户
router.delete('/deleteUser/:userId', function (req, res, next) {
	let {
		userId
	} = req.params;
	console.log('userId', userId)
	User.deleteOne({
		_id: userId
	}, (err, data) => {
		if (err) {
			return res.send({
				errcode: 999,
				message: '删除用户失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '删除用户成功!'
		})
	})
})

// 更新用户信息
router.put('/updateclient/:_id', function (req, res, next) {
	let {
		body
	} = req;
	User.findOneAndUpdate({
		_id: body._id
	}, {
		account: body.account,
		password: body.password,
		name: body.name,
		jurisdiction: body.jurisdiction,
	}, (err, user) => {
		if (err) {
			return res.send({
				errcode: 999,
				message: '更新用户信息失败!'
			});
		}
		res.send({
			errcode: 0,
			message: '更新用户信息成功!'
		})
	})

})

// 加入书架
router.post('/joinBookrack', function (req, res, next) {
	let {
		bookId
	} = req.body;
	console.log(req.session)
	let {
		client
	} = req.session
	if (client) {
		User.findOne({
			openid: client.openid
		}, function (err, user) {
			if (err) {
				return res.send({
					errcode: 999,
					message: '获取用户信息失败!'
				})
			}
			if (user) {
				// console.log(user)
				let {
					bookIdList
				} = user;
				// 当前书籍已添加至书架
				if (bookIdList.includes(bookId)) {
					return res.send({
						errcode: 889,
						message: '当前书籍已经添加至书架!'
					})
				}
				bookIdList = JSON.parse(JSON.stringify(bookIdList));
				bookIdList.push(bookId);
				User.findOneAndUpdate({
					openid: client.openid
				}, {
					bookIdList
				}, function (err, data) {
					if (err) {
						return res.send({
							errcode: 999,
							message: '加入书架失败!'
						})
					}
					res.send({
						errcode: 0,
						message: '加入书架成功!'
					});
				})
			} else {
				res.send({
					errcode: 993,
					message: '当前用户不存在!'
				})
			}
		})
	} else {
		res.send({
			errcode: 991,
			message: '服务器登录态失效!'
		})
	}
});

// 移出书架
router.post('/removeBookrack', function (req, res, next) {
	let {
		client
	} = req.session;
	let {
		bookId
	} = req.body;
	console.log(client)
	console.log(bookId)
	if (!client) {
		return res.send({
			errcode: 991,
			message: '服务器登录态失效!'
		})
	}
	User.findOne({
		openid: client.openid
	}, function (err, user) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '获取用户信息失败!'
			});
		}
		if (!user) {
			return res.send({
				errcode: 993,
				message: '当前用户不存在!'
			});
		}
		let {
			bookIdList
		} = user;
		bookIdList = JSON.parse(JSON.stringify(bookIdList))
		let index = bookIdList.findIndex((item) => {
			return item === bookId
		});
		bookIdList.splice(index, 1);
		User.findOneAndUpdate({
			openid: client.openid
		}, {
			bookIdList
		}, function (err, data) {
			if (err) {
				res.send({
					errcode: 999,
					messgae: '移出书架失败!'
				});
			} else {
				res.send({
					errcode: 0,
					message: '移出书架成功!',
					bookId
				})
			}
		})
	})
});

// 本地数据同步
router.get('/sync/local/:bookId', function (req, res, next) {
	let {
		bookId
	} = req.params;
	Catalog2.find({
		bookId
	}, function(err, sectionList) {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询数据库失败!'
			});
		}
		if (sectionList && sectionList.length) {
			sectionList = JSON.parse(JSON.stringify(sectionList));
			sectionList.forEach(item => {
				delete item._id
				delete item.__v
			})
			// console.log(sectionList)
			// Catalog.insertMany(sectionList, function(err, ) {})
			// sectionList.forEach(item => {
			// 	let catalog = new Catalog({
			// 		bookId: item.bookId,
			// 		bookName: item.bookName,
			// 		author: item.author,
			// 		title: item.title,
			// 		url: item.url,
			// 		sectionId: item.sectionId
			// 	});
			// 	catalog.save(function(err, data) {
			// 		if (err) return console.log(err);
			// 	});
			// })
			return res.send({
				errcode: 0,
				message: '本地爬虫数据同步至数据库成功!'
			});
		} else {
			return res.send({
				errcode: 10001,
				message: '本地爬虫数据库中不存在该书籍信息!'
			});
		}
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

module.exports = router;