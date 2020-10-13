const mongoose = require('mongoose');

const sectionContent = new mongoose.Schema({
	bookId: String, // 书id
	bookName: String, // 书名
	author: String, // 作者
	title: String, // 章节名称
	sectionId: String, // 章节id
	content: String // 章节内容
}, {
	collection: 'section_content'
})

module.exports = mongoose.model('section_content', sectionContent)
