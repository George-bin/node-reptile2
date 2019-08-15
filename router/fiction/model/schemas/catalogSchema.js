const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
	bookId: Number, // 书id
	title: String, // 章节名称
	url: String, // 章节地址
	sortId: String // 排序id
}, {
	collection: 'catalog'
})

module.exports = mongoose.model('catalog', catalogSchema)