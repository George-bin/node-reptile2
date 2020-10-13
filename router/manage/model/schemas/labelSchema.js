const mongoose = require('mongoose');

const classifySchema = new mongoose.Schema({
  name: String, // 标签名称
  createTime: Date, // 创建时间
	updateTime: Date // 更新时间
}, {
  collection: 'label_list'
})

module.exports = mongoose.model('label_list', classifySchema)
