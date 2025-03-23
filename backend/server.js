'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const Koa = require('koa');                          // the app manager with middleware similar to Express
const logger = require('koa-logger');                // simple console logger to track requests
const bodyParser = require('koa-bodyparser');        // URL parser building the params object (in ctx)
const MemoryStore = require('koa-session-memory');   // a memory storage for the session object
const session = require('koa-session');              // the session manager using a cookie
const Pug = require('koa-pug');                      // the HTML page builder from a template (PUG syntax)
const router = require('./middleware/router');       // the app request router

const app = new Koa();
const store = new MemoryStore();

//configure Pug
const pug = new Pug({
  viewPath: path.resolve(process.cwd(), 'views'),
  basedir: path.resolve(process.cwd(), 'views'),
  app: app
});

//logger
app.use(logger());

//body parser
app.use(bodyParser());

//sessions
app.keys = ['key for cookie signature'];                            // CHANGE to an unpredictable string
app.use(session({ store, key: 'sesid', maxAge: 20 * 60 * 1000 }, app));     // 20 min sessions with 'sesid' cookie

//router
app.use(router.routes());
app.use(router.allowedMethods());

// build server
const serverCallback = app.callback();


// server configuration (HTTP) and (HTTPS)
const config = {
  domain: "localhost",
  https: {
    port: 9000,
    /*
    options: {
      key: fs.readFileSync(path.resolve(process.cwd(), 'certs/server.key'), 'utf8').toString(),
      cert: fs.readFileSync(path.resolve(process.cwd(), 'certs/server.crt'), 'utf8').toString()
    }
    */
  },
  http: {
    port: 9001
  }
};

// bind the server callback function to listening a port
/*
try {
  const httpsServer = https.createServer(config.https.options, serverCallback);
  httpsServer.listen(config.https.port, function (err) {
    if (!!err) {
      console.error('HTTPS fail: ', err, (err && err.stack));
    }
    else {
      console.log('Server running on https://' + config.domain + ':' + config.https.port);
    }
  });
}
catch (exc) {
  console.error('Exited: ', exc, (exc && exc.stack));
}
*/
try {
  const httpServer = http.createServer(serverCallback);
  httpServer.listen(config.http.port, function (err) {
    if (!!err) {
      console.error('HTTP fail: ', err, (err && err.stack));
    }
    else {
      console.log('Server running on http://' + config.domain + ':' + config.http.port);
    }
  });
  app.context.baseHttp = 'http://' + config.domain + ':' + config.http.port
}
catch (exc) {
  console.error('Exited: ', exc, (exc && exc.stack));
}

