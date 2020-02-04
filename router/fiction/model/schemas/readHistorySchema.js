const mongoose = require('mongoose');

const user = new mongoose.Schema({
  account: String, // 账户
  bookId: String, // 书籍id
  sectionId: String // 章节id
}, {
  collection: 'read_history_list'
});

module.exports = mongoose.model('read_history_list', user)
