const KoaRouter = require('koa-router');
const dataDB = require('../database/dbops');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const router = new KoaRouter();

// Routing REST requests
router
  .get('/', root_hello)
  .get('/users/:user', show_user_dirs)
  .get('/dirs/:dir/:user', open_dir)
  .get('/dir/back/:user', back_dir)
  .get('/files/:file/:user', read_file)
  
// The root endpoint for online verification ...
async function root_hello(ctx) {
  ctx.body = '<h3>Welcome to the File Services server.</h3>';
}

async function show_user_dirs(ctx) {
  const thisuser = await dataDB.getUser(ctx.params.user);
  const ok = (thisuser !== "");
  if (ok) {
    ctx.session.user = thisuser;
    ctx.session.current_dir = path.resolve(process.cwd(), 'files', ctx.params.user);
    ctx.session.authorized = false;
    await show_dir(ctx);
  }
  else {
    ctx.session = null
    await ctx.render('nouser', {user: ctx.params.user});
  }
}

async function open_dir(ctx) {
  if (!ctx.session.user)
    ctx.redirect('/users/' + ctx.params.user);
  if (ctx.session.user !== ctx.params.user) {
    await ctx.render('error', {error: 406, msg: 'user not acceptable'});
    return;
  }
  if (ctx.params.dir === 'private' && !ctx.session.authorized) {
    await ctx.render('notauth', {user: ctx.params.user});
    return;
  }
  if (!fs.existsSync(path.resolve(ctx.session.current_dir, ctx.params.dir))) {
    await ctx.render('error', {error: 406, msg: 'wrong dir', back: '/users/'+ctx.session.user});
    return;
  }  
  ctx.session.current_dir = path.resolve(ctx.session.current_dir, ctx.params.dir);
  await show_dir(ctx);
}

async function back_dir(ctx) {
  if (!ctx.session.user)
    ctx.redirect('/users/' + ctx.params.user);
  if (ctx.session.user !== ctx.params.user) {
    await ctx.render('error', {error: 406, msg: 'user not acceptable'});
    return;
  }
  const index = ctx.session.current_dir.lastIndexOf('\\');
  if (!(ctx.session.current_dir.substring(0, index).includes(path.resolve(process.cwd(), 'files', ctx.session.user)))) {
    await ctx.render('error', {error: 406, msg: 'wrong back dir', back: '/users/'+ctx.session.user});
    return;
  }
  ctx.session.current_dir = ctx.session.current_dir.substring(0, index);
  await show_dir(ctx);
}

async function show_dir(ctx) {
  const content = await fsp.readdir(ctx.session.current_dir, {withFileTypes: true});
  var index = ctx.session.current_dir.lastIndexOf('public');
  if (index === -1)
    index = ctx.session.current_dir.lastIndexOf('private');
  const cdir = (index === -1) ? "\\" : ctx.session.current_dir.substring(index);
  const files = [];
  for (const entry of content) {
    const file = {name: entry.name, type: entry.isDirectory() ? "directory" : "file"};
    files.push(file);
  }
  await ctx.render('userpub', {user: ctx.params.user, base: ctx.baseHttp, cdir: cdir, files: files});
}

async function read_file(ctx) {
  if (!ctx.session.user)
    ctx.redirect('/users/' + ctx.params.user);
  if (ctx.session.user !== ctx.params.user) {
    await ctx.render('error', {error: 406, msg: 'user not acceptable'});
    return;
  }
  const file_name = path.resolve(ctx.session.current_dir, ctx.params.file);
  if (!fs.existsSync(file_name)) {
    await ctx.render('error', {error: 404, msg: 'File not found!', back: '/users/'+ctx.session.user});
    return;
  }
  const content = await fsp.readFile(file_name);
  ctx.body = content.toString();
}

module.exports = router;
