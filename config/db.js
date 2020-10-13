var mysql = require("mysql")


/**
 *创建数据连接池
 */
var pool = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "g_book",
    timezone: "08:00"
})

/**
 * 非事务执行
 * @param {*} sql 
 * @param {*} callback 
 */
const query = async function (sql) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err)
            } else {
                connection.query(sql, function (err, rows) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    connection.release()
                })
            }
        })
    })
}


/**
 * 创建一个数据库连接
 */
const getConnection = async function () {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err)
            } else {
                resolve(connection)
            }
        })
    })
}

class DBUnity {
    /**
     * 开启数据库连接
     * @param {*} connection 
     */
    constructor(connection) {
        this.blTransaction = false;
        this.connection = connection;

        /**
         * 开启事务
         */
        this.beginTransaction = async () => {
            return new Promise((resolve, reject) => {
                this.connection.beginTransaction((err,success) => {
                    if (err) {
                        this.blTransaction = false
                        reject(err)
                    } else {
                        this.blTransaction = true
                        resolve(success)
                    }
                })
            })
        }

        /**
         * 执行sql
         * @param {*} sql 
         */
        this.query = async (sql) => {
            return new Promise((resolve, reject) => {
                this.connection.query(sql, (err, rows) => {
                    if (!this.blTransaction) {
                        this.connection.release();
                        reject(new DBResult(0, false, "事务未开启", null))
                    }
                    if (err) {
                        reject(new DBResult(0, false, JSON.stringify(err), null))
                    } else {
                        resolve(new DBResult(1, true, "success", rows))
                    }
                })
            })
        }

        /**
         * 提交事务
         */
        this.commit = async () => {
            return new Promise((resolve, reject) => {
                this.connection.commit((err) => {
                    if (err) {
                        this.connection.release();
                        reject(err)
                    } else {
                        this.connection.release();
                    }
                })
            })
        }
        /**
         * 回滚事务
         */
        this.rollback = async () => {
            this.connection.rollback(() => {
                this.connection.release();
            })
        }
    }
}

class DBResult{
    /**
   * 数据层结果返回
   * @param {number} code 返回状态码 0:操作失败,1:操作成功
   * @param {boolean} success 
   * @param {string} message 返回信息
   * @param {object} data 返回数据对象
   */
    constructor(code,success,message,data){
      this.code = code;
      this.message = message;
      this.data = data;
      this.success = success;
    }
}

module.exports = {
    query,
    DBUnity,
    getConnection
}