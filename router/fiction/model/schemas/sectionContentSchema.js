const mongoose = require('mongoose');

const sectionContent = new mongoose.Schema({
	bookId: Number, // 书id
	title: String, // 章节名称
	sectionId: String, // 章节id
	content: String // 章节内容
}, {
	collection: 'sectionContent'
})

module.exports = mongoose.model('sectionContent', sectionContent)