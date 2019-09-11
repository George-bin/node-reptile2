const mongoose = require('mongoose');

const manageUser = new mongoose.Schema({
  account: String, // 账户
  password: String // 密码
}, {
  collection: 'bookManageUserList'
})

module.exports = mongoose.model('bookManageUserList', manageUser)
