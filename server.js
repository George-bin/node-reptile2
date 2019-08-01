var http = require('http');
var fs = require('fs');
// 可以理解为运行在后台的 jQuery
var cheerio = require('cheerio');
// 模块进行转码，中文显示正常后开始解析源码
var iconv = require('iconv-lite');

let url = 'https://m.qidian.com/book/1013311315';
// 资源请求
http.get(url, function (res) {
    var chunks = [];
    res.on('data', function (chunk) {
        chunk.push(chunk);
    });
    res.on('end', function () {
        // 转码操作
        var html = icvo.decode(Buffer.concat(chunks), 'gb2312');
        // 源码解析
        var $ = cheerio.load(html, {
            //如果设置为true，将对文档中的实体进行解码。默认为false。
            decodeEntities: false
        });
        var content = $('tbody');
        var links = [];
        for(var i=1;i<68;i++){
            var link={};
            link.title = $(this).text()
            link.link =  'http://www.qmlike.com/m/read-htm-tid-319317-page-'+i+'.html#yinzi' //补齐 URL 信息
            links.push(link)
        }
        //将url信息写入list.json;其实这一步是多余的，可以省略。直接getContent；
        fs.writeFile("list.json", JSON.stringify(links), function(err) {
            if (!err) {
                console.log("写文件成功")
                var urlList = JSON.parse(fs.readFileSync('list.json', 'utf8'))
                for (var i = 0; i < urlList.length; i++) {
                    getContent(urlList[i])
                }
            }
        })
        function getContent(chapter) {
            var res = request('GET',chapter.link)
            var html = iconv.decode(res.body, 'gb2312') //获取源码

            var $ = cheerio.load(html, {
                decodeEntities: false
            })
            var content = ($("div.yinzi").text()).replace(/\&nbsp;/g, '')
           //生成xx.txt;
            if (fs.existsSync('xx.txt')) {//如果路径存在，则返回 true，否则返回 false
            //同步地将数据追加到文件中，如果文件尚未存在，则创建文件
                fs.appendFileSync('xx.txt',  chapter.title)//
                fs.appendFileSync('xx.txt', content)
            } else {
                fs.writeFileSync('xx.txt', chapter.title)//同步写入数据到文件，如果文件已经存在，则替代文件
                fs.appendFileSync('xx.txt', content)
            }

            console.log(content);
        }
    }).on('error', function () {
        console.log("网页访问出错")
    })
});


