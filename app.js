const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
// cheerio相当于node版的jQuery，用过jQuery的同学会非常容易上手。它主要是用来获取抓取到的页面元素和其中的数据信息;
const cheerio = require('cheerio');
// 模块进行转码，中文显示正常后开始解析源码；
const iconv = require('iconv-lite');
//因为需要确保章节的顺序，所以这里引进 sync-request 模块进行同步 request 请求资源；
const request = require('sync-request');
// superagent是node里一个非常方便的、轻量的、渐进式的第三方客户端请求代理模块，用他来请求目标页面
const superagent = require('superagent');

// 路由
const fictionRouter = require('./router/fiction');

// 数据库 start
const mongoose = require('mongoose');
// 连接数据库（vueData为数据库的名字）
mongoose.connect('mongodb://localhost:27017/ReptileData');
// connect()返回一个状态待定（pending）的接连，接着加上成功提醒和失败警告；
mongoose.connection.on('error', console.error.bind(console, '数据库连接失败!'));
mongoose.connection.once('open', function() {
	console.log('数据库连接成功!');
});
mongoose.connection.on('disconnected', function() {
	console.log('数据库断开!');
});
// 数据库 end

const app = express();

const model = require("./router/fiction/model");
const Catalog = model.Catalog;
const SectionContent = model.SectionContent;

// 小说路由
app.use('/api/book/', fictionRouter)

let url = 'http://www.quanshuwang.com/book/91/91557';
// getCatalog(url);
// 获取小说目录
let catalog = [];

function getCatalog(url) {
	http.get(url, function(res) {
		let chunks = [];
		res.on('data', function(chunk) {
			console.log('数据进来啦!');
			chunks.push(chunk);
		});
		res.on('end', function() {
			console.log('数据接收完成!')
			// 转码操作
			var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
			var $ = cheerio.load(html, {
				// 如果设置为true，将对文档中的实体进行解码。默认为false。
				decodeEntities: false
			});
			$('.chapterNum li a').each((idx, ele) => {
				let catalog = new Catalog({
					bookId: 41,
					title: $(ele).text(),
					url: $(ele).attr('href'),
					sortId: idx.toString().padStart(6, '0')
				});
				catalog.save(function(err, data) {
					if (err) return console.log(err);
				})
				// console.log(idx)
				// catalog.push({
				// 	bookId: 41,
				// 	title: $(ele).text(),
				// 	url: $(ele).attr('href'),
				// 	sortId: idx.toString().padStart(6, '0')
				// });
			});
		});
	}).on('error', function() {
		console.log('获取小说目录失败!')
	});
}

// 获取章节内容
function getSectionContent({
	url,
	bookId,
	title,
	sectionId
}) {
	let sectionInfo = '';
	http.get(url, function(res) {
		let chunks = [];
		res.on('data', function(chunk) {
			console.log('数据进来啦!');
			chunks.push(chunk)
		});
		res.on('end', function() {
			console.log('数据接收完成!')
			// 转码操作
			var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
			var $ = cheerio.load(html, {
				// 如果设置为true，将对文档中的实体进行解码。默认为false。
				decodeEntities: false
			});
			sectionInfo = $('#content').text();
			let sectionContent = new SectionContent({
				bookId: bookId,
				title: title,
				sectionId: sectionId,
				content: sectionInfo
			});
			sectionContent.save(function(err, data) {
				if (err) return console.log(err);
			})
			return sectionInfo;
		});
	}).on('error', function() {
		console.log('获取章节内容失败!')
		return 'fail';
	});
}

// 保存至数据库
function saveDatabase(url) {
	http.get(url, function(res) {
		let chunks = '';
		res.on('data', function(chunk) {
			chunks += chunk;
		});
		res.on('end', function() {
			let catalogs = JSON.parse(chunks).catalogData;
			catalogs.forEach((item, index) => {
				setTimeout(() => {
					getSectionContent({
						url: item.url,
						bookId: item.bookId,
						title: item.title,
						sectionId: item.sortId
					})
				}, 1000 * index)
			})
		})
	})
}

// saveDatabase('http://localhost:3000/api/book/catalog/41')


app.get('/', async function(req, res, next) {
	// res.send('success');
	res.send({
		catalog
	});
});

module.exports = app;