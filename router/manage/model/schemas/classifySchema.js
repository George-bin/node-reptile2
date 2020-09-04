/*
 * @Author: your name
 * @Date: 2020-03-01 15:23:01
 * @LastEditTime: 2020-09-04 15:37:21
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-reptile\router\fiction\model\schemas\classifySchema.js
 */
const mongoose = require('mongoose');

const classifySchema = new mongoose.Schema({
  classifyName: String, // 分类名称
  createTime: Number, // 创建时间
  updateTime: Number // 更新时间
}, {
  collection: 'classify_list'
})

module.exports = mongoose.model('classify_list', classifySchema)
