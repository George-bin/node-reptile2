const http = require("http");
const https = require("https");
const Nightmare = require("nightmare"); // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true }); // show:true  显示内置模拟浏览器

// cheerio相当于node版的jQuery，用过jQuery的同学会非常容易上手。它主要是用来获取抓取到的页面元素和其中的数据信息;
const cheerio = require("cheerio");
// 模块进行转码，中文显示正常后开始解析源码；
const iconv = require("iconv-lite");
//因为需要确保章节的顺序，所以这里引进 sync-request 模块进行同步 request 请求资源；
const request = require("sync-request");
// superagent是node里一个非常方便的、轻量的、渐进式的第三方客户端请求代理模块，用他来请求目标页面
const superagent = require("superagent");

const model = require("../router/fiction/model");
const Catalog = model.Catalog;
const SectionContent = model.SectionContent;

let url = "https://www.qb5.tw/shu/1795.html";
// getCatalog({
// 	url,
// 	bookId: 1,
// 	bookName: '太古剑尊',
// 	author: '青石细语'
// });
// 获取小说目录
let catalog = [];

function getCatalog({ url, bookId, bookName, author }) {
  https
    .get(url, function(res) {
      let chunks = [];
      res.on("data", function(chunk) {
        console.log("数据进来啦!");
        chunks.push(chunk);
      });
      res.on("end", function() {
        console.log("数据接收完成!");
        // 转码操作
        var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
        // var html = iconv.decode(Buffer.concat(chunks), "utf-8");
        // console.log(html)
        var $ = cheerio.load(html, {
          // 如果设置为true，将对文档中的实体进行解码。默认为false。
          decodeEntities: false
        });
        // $('.chapterNum li a').each((idx, ele) => {
        // 	let catalog = new Catalog({
        // 		bookId: bookId,
        // 		bookName: bookName,
        // 		author: author,
        // 		title: $(ele).text(),
        // 		url: $(ele).attr('href'),
        // 		sectionId: idx.toString().padStart(6, '0')
        // 	});
        // 	catalog.save(function(err, data) {
        // 		if (err) return console.log(err);
        // 	})
        // });

        // 全本小说
        $('.zjlist dd:nth-child(n+4) a').each((idx, ele) => {
        	console.log($(ele).text())
        	let catalog = new Catalog({
        		bookId: bookId,
        		bookName: bookName,
        		author: author,
        		title: $(ele).text(),
        		url: 'https://www.qb5.tw'+$(ele).attr('href'),
        		sectionId: idx.toString().padStart(6, '0')
        	});
        	catalog.save(function(err, data) {
        		if (err) return console.log(err);
        	})
        });

        // 66小说网
        // $(".chapters li:nth-child(n+2) a").each((idx, ele) => {
        //   console.log("啦啦啦");
        //   let catalog = new Catalog({
        //     bookId: bookId,
        //     bookName: bookName,
        //     author: author,
        //     title: $(ele).text(),
        //     url: $(ele).attr("href"),
        //     sectionId: idx.toString().padStart(6, "0")
        //   });
        //   catalog.save(function(err, data) {
        //     if (err) return console.log(err);
        //   });
        // });
      });
    })
    .on("error", function() {
      console.log("获取小说目录失败!");
    });
}

// 获取章节内容
function getSectionContent({
  url,
  bookId,
  title,
  sectionId,
  bookName,
  author
}) {
  let sectionInfo = "";
  https
    .get(url, function(res) {
      let chunks = [];
      res.on("data", function(chunk) {
        console.log("数据进来啦!");
        chunks.push(chunk);
      });
      res.on("end", function() {
        console.log("数据接收完成!");
        // 转码操作
        var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
        // var html = iconv.decode(Buffer.concat(chunks), "utf-8");
        var $ = cheerio.load(html, {
          // 如果设置为true，将对文档中的实体进行解码。默认为false。
          decodeEntities: true
        });
        sectionInfo = $('#content').text();
        // sectionInfo = $('#booktext').text();
        // sectionInfo = $(".content").text();
        let sectionContent = new SectionContent({
          bookId: bookId,
          bookName: bookName, // 书名
          author: author, // 作者
          title: title,
          sectionId: sectionId,
          content: sectionInfo
        });
        sectionContent.save(function(err, data) {
          if (err) return console.log(err);
        });
        return sectionInfo;
      });
    })
    .on("error", function() {
      console.log("获取章节内容失败!");
      return "fail";
    });
}

// 保存至数据库
function saveDatabase(url) {
  http.get(url, function(res) {
    let chunks = "";
    res.on("data", function(chunk) {
      chunks += chunk;
    });
    res.on("end", function() {
      let catalogs = JSON.parse(chunks).catalogData;
      catalogs.forEach((item, index) => {
        setTimeout(() => {
          getSectionContent({
            url: item.url,
            bookId: item.bookId,
            title: item.title,
            sectionId: item.sectionId,
            bookName: item.bookName, // 书名
            author: item.author // 作者
          });
        }, 1000 * index);
      });
    });
  });
}

// 完善章节（避免漏掉）
function aviodMissingSection(url) {
  http.get(url, function(res) {
    let chunks = "";
    res.on("data", function(chunk) {
      console.log("数据进来啦");
      chunks += chunk;
    });
    res.on("end", function() {
      console.log("数据接收完成");
      let catalogs = JSON.parse(chunks).catalogData;

      catalogs.forEach((item, index) => {
        // console.log(item.bookName);
        setTimeout(() => {
          http.get(
            `http://localhost:8888/api/book/content/${item.bookId}/${item.sectionId}`,
            function(res2) {
              let data = "";
              res2.on("data", function(chunk) {
                // console.log('数据进来啦')
                data += chunk;
              });
              res2.on("end", function() {
                // console.log(data);
                data = JSON.parse(data);
                if (data.errcode !== 0) {
                  console.log("补漏调用")
                  getSectionContent({
                    url: item.url,
                    bookId: item.bookId,
                    title: item.title,
                    sectionId: item.sectionId,
                    bookName: item.bookName, // 书名
                    author: item.author // 作者
                  });
                }
              });
            }
          );
        }, 50 * index);
      });
    });
  });
}
// aviodMissingSection('http://localhost:8888/api/book/catalog/1?page=all')

// saveDatabase('http://localhost:8888/api/book/catalog/1?page=all')