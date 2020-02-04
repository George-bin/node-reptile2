const Catalog = require('./schemas/catalogSchema.js');
const Catalog2 = require('./schemas/catalogSchema2.js');
const SectionContent = require('./schemas/sectionContentSchema.js');
const SectionContent2 = require('./schemas/sectionContentSchema2.js');
const Book = require('./schemas/bookSchema.js');
const Classify = require('./schemas/classifySchema.js');
const User = require('./schemas/userSchema.js');
const ManageUser = require('./schemas/bookManageUserSchema.js');

module.exports = {
	Catalog,
	SectionContent,
	Book,
	Classify,
	User,
	ManageUser,
	Catalog2,
	SectionContent2
}
