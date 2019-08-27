const mongoose = require('mongoose');

const classifySchema = new mongoose.Schema({
  classifyId: String, // 分类id
  classifyName: String // 分类名称
}, {
  collection: 'classifyList'
})

module.exports = mongoose.model('classifyList', classifySchema)
