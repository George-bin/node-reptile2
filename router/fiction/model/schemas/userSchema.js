const mongoose = require('mongoose');

const user = new mongoose.Schema({
  account: String, // 账户
  password: String, // 密码
  username: String, // 用户昵称
  name: String, // 用户名称
  jurisdiction: String, // 用户权限
  bookIdList: Array, // 用户书架
  avatarUrl: String, // 用户头像
  openid: String // 微信小程序用户id
}, {
  collection: 'bookUserList'
})

module.exports = mongoose.model('bookUserList', user)
