const http = require("http");
const https = require("https");
const fs = require("fs");
const app = require("./app");
const serverConfig = require("./config");

// 启动服务 start
let httpServer = http.createServer(app);
httpServer.listen(serverConfig.port);
httpServer.on("error", function() {
  console.log("服务启动失败!");
});
httpServer.on("listening", function() {
  console.log(`服务启动，端口${serverConfig.port}!`);
});
// 启动服务 end

// https服务start
// const httpsOption = {
// 	key: fs.readFileSync('./ssl/gengshaobin.top.key'), //证书文件的存放目录
// 	cert: fs.readFileSync('./ssl/gengshaobin.top.pem')
// };

// let httpsServer = https.createServer(httpsOption, app)
// httpsServer.listen(443);
// httpsServer.on('error', function() {
// 	console.log('https服务启动失败!')
// });
// httpsServer.on('listening', function() {
// 	console.log('https服务启动，端口443!');
// });
// https服务end
