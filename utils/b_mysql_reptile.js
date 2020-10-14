const http = require("http");
const https = require("https");
const Nightmare = require("nightmare"); // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true }); // show:true  显示内置模拟浏览器
const uuid = require('node-uuid');
const moment = require('moment');
const db = require('../config/db')

// cheerio相当于node版的jQuery，用过jQuery的同学会非常容易上手。它主要是用来获取抓取到的页面元素和其中的数据信息;
const cheerio = require("cheerio");
// 模块进行转码，中文显示正常后开始解析源码；
const iconv = require("iconv-lite");
//因为需要确保章节的顺序，所以这里引进 sync-request 模块进行同步 request 请求资源；
const request = require("sync-request");
// superagent是node里一个非常方便的、轻量的、渐进式的第三方客户端请求代理模块，用他来请求目标页面
const superagent = require("superagent");

let book = {
  id: 2,
  name: '斗罗大陆',
  author: '唐家三少'
}

// getCatalog('https://www.qb5.tw/book_518/');
/**
 * 获取小说章节目录
 * @param url
 */
function getCatalog(url) {
  https.get(url, function(res) {
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
      // 全本小说
      $('.zjlist dd:nth-child(n+15) a').each(async (idx, ele) => {
        console.log($(ele).text())
        try {
          let m_id = uuid.v1();
          m_id = m_id.replace(/-/g,'');
          let name = $(ele).text();
          let url = 'https://www.qb5.tw/book_518/'+$(ele).attr('href');
          console.log(url)
          await db.query(`INSERT INTO g_book_catalog2 VALUES('${m_id}','${name}','${url}',${book.id})`)
        } catch(err) {
          console.log('SQL出错啦～～',err);
        }
      });

      // 66小说网
      // $(".chapters li:nth-child(n+2) a").each((idx, ele) => {
      // });
    });
  })
  .on("error", function() {
    console.log("获取小说目录失败!");
  });
}

// aviodMissingSection();
/**
 * 获取章节内容
 * @returns {Promise<void>}
 */
async function aviodMissingSection() {
  let catalog = await db.query(`SELECT * FROM g_book_catalog2`);
  console.log('章节数量：',catalog.length)
  for (let i=0, len=catalog.length; i < len; i++) {
    let ch = catalog[i];
    let chapter = await db.query(`SELECT * FROM g_book_chapter2 WHERE z_id='${catalog[i].z_id}'`);
    if (!chapter.length) {
      https.get(ch.url, function(res) {
        let chunks = [];
        res.on("data", function(chunk) {
          console.log("数据进来啦!");
          chunks.push(chunk);
        });
        res.on("end", async function() {
          console.log("数据接收完成!");
          // 转码操作
          let html = iconv.decode(Buffer.concat(chunks), 'gb2312');
          // var html = iconv.decode(Buffer.concat(chunks), "utf-8");
          let $ = cheerio.load(html, {
            // 如果设置为true，将对文档中的实体进行解码。默认为false。
            decodeEntities: true
          });
          let content = $('#content').text();
          // sectionInfo = $('#booktext').text();
          // sectionInfo = $(".content").text();

          // console.log('小说内容：',content)
          let z_id = uuid.v1();
          z_id = z_id.replace(/-/g,'');
          await db.query(`INSERT INTO g_book_chapter2 VALUES('${z_id}','${ch.name}','${content}','${ch.b_id}','${ch.m_id}')`)
        });
      })
        .on("error", function() {
          console.log("获取章节内容失败!");
          return "fail";
        });
    }
  }
}

// reptileTest('https://www.qb5.tw/book_518/308379.html')
/**
 * 单页测试
 * @returns {Promise<void>}
 */
async function reptileTest(url) {
  https.get(url, function(res) {
    let chunks = [];
    res.on("data", function(chunk) {
      console.log("数据进来啦!");
      chunks.push(chunk);
    });
    res.on("end", function() {
      console.log("数据接收完成!");
      // 转码操作
      let html = iconv.decode(Buffer.concat(chunks), 'gb2312');
      // var html = iconv.decode(Buffer.concat(chunks), "utf-8");
      // console.log(html)
      let $ = cheerio.load(html, {
        // 如果设置为true，将对文档中的实体进行解码。默认为false。
        decodeEntities: false
      });
      let content = $('#content').text();
      console.log(content)
    });
  })
    .on("error", function() {
      console.log("获取小说目录失败!");
    });
}
