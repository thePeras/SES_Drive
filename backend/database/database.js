'use strict';
const configurations = require('./db.config.json');
const mysql = require('mysql2/promise');

const dbconfig = configurations.mysqldb;

module.exports.init = function () {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    connectionLimit: dbconfig.connectionLimit,
    database: dbconfig.database,
    debug: dbconfig.debug
  });
}
