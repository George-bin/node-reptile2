const mongoose = require('mongoose');

const manageUser = new mongoose.Schema({
  account: String, // 账户
  password: String // 密码
}, {
  collection: 'book_manage_user_list'
})

module.exports = mongoose.model('book_manage_user_list', manageUser)
