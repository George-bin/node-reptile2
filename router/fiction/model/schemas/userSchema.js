const mongoose = require('mongoose');

const user = new mongoose.Schema({
  account: String, // 账户
  password: String, // 密码
  username: String, // 用户昵称
  name: String, // 用户名称
  jurisdiction: String, // 用户权限
  bookIdList: String, // 用户书架
  headPortarit: String // 用户头像
}, {
  collection: 'bookUserList'
})

module.exports = mongoose.model('bookUserList', user)
