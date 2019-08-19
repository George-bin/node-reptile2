const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
	classify: String, // 分类
	bookId: Number, // 书id
	bookName: String, // 书名
	bookCover: String, // 图片
	sectionCount: Number, // 章节数
	bookIntro: String, // 简介
	author: String, // 作者
	popularityIndex: Number, // 人气指数
	grade: Number, // 评分
	like: Number, // 点赞
	label: String // 标签
}, {
	collection: 'bookList'
})

module.exports = mongoose.model('bookList', bookSchema)
