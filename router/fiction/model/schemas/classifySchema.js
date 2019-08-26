const mongoose = require('mongoose');

const classifySchema = new mongoose.Schema({
  classifyId: String, // 分类id
  classifyName: String, // 分类名称
  classifyBookCount: Number // 书籍数量
}, {
  collection: 'classifyList'
})

module.exports = mongoose.model('classifyList', classifySchema)
