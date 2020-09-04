const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
	bookId: Number, // 书id
	bookName: String, // 书名
	author: String, // 作者
	title: String, // 章节名称
	url: String, // 章节地址
	sectionId: String // 排序id
}, {
	collection: 'catalog2'
})

module.exports = mongoose.model('catalog2', catalogSchema)
