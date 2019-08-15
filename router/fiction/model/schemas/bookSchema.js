const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
	bookId: Number, // 书id
	bookName: String, // 书名
	bookImage: String, // 图片
	sectionCount: Number, // 章节数
	bookIntro: String // 简介
}, {
	collection: 'bookList'
})

module.exports = mongoose.model('bookList', bookSchema)