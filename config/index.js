/*
 * @Author: your name
 * @Date: 2020-01-16 09:14:48
 * @LastEditTime: 2020-09-04 15:02:08
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-reptile\config\index.js
 */
const dev = require('./dev');
const prod = require('./prod');
const os = require('os');

const type = os.type();
let conf = {}

// 运行环境区分
if (type === 'Windows_NT') {
  conf = {
    ...dev,
    upload_path: 'D:/public/uploads'
  }
} else if (type === 'Darwin') {
  conf = {...dev}
} else if (type === 'Linux') {
  conf = {...prod}
}


module.exports =  {
  ...conf
}
