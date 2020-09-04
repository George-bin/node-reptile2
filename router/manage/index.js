// 引入express模块
const express = require('express');
const fs = require('fs');
const https = require('https');
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
			// console.log('chunks')
			// console.log(chunks)
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
});

// 小程序-自动登录
router.post('/wx/autoLogin', function (req, res, next) {
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
			message: '登录态失效，请重新登录!'
		})
	}
	User.findOne({
		account: body.account
	}, (err, user) => {
		if (err) {
			return res.send({
				errcode: 999,
				message: '查询用户失败!'
			})
		}
		if (user) {
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
	// console.log(req.session)
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



module.exports = router;

require("./classify");
require("./book");