'use strict';
const dbconfig = require('./db.config.json').mysqldb;

class DataDB {
  constructor() {
    const database = require('./database');
    this.db = database.init();
    if (!!this.db)
      console.log("Connected to DB: ", dbconfig.database);
    else
      console.log("Not connected to the database!");
  }

  async getUser(user) {
    const [rows, defs] = await this.db.execute('SELECT * FROM users WHERE uname=?', [user]);  // uses prepared statement with injection protection
    if (rows.length === 0 || rows.length > 1)
      return "";
    else
      return rows[0].uname;
  }
}

module.exports = new DataDB();
