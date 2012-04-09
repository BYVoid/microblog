var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');

module.exports = function(app) {
  app.get('/', function(req, res) {
    Post.get(null, function(err, posts) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: '首頁',
        posts: posts,
      });
    });
  });
  
  app.get('/reg', checkNotLogin);
  app.get('/reg', function(req, res) {
    res.render('reg', {
      title: '用戶註冊',
    });
  });
  
  app.post('/reg', checkNotLogin);
  app.post('/reg', function(req, res) {
    //檢驗用戶兩次輸入的口令是否一致
    if (req.body['password-repeat'] != req.body['password']) {
      req.flash('error', '兩次輸入的口令不一致');
      return res.redirect('/reg');
    }
  
    //生成口令的散列值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');
    
    var newUser = new User({
      name: req.body.username,
      password: password,
    });
    
    //檢查用戶名是否已經存在
    User.get(newUser.name, function(err, user) {
      if (user)
        err = 'Username already exists.';
      if (err) {
        req.flash('error', err);
        return res.redirect('/reg');
      }
      //如果不存在則新增用戶
      newUser.save(function(err) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg');
        }
        req.session.user = newUser;
        req.flash('success', '註冊成功');
        res.redirect('/');
      });
    });
  });
  
  app.get('/login', checkNotLogin);
  app.get('/login', function(req, res) {
    res.render('login', {
      title: '用戶登入',
    });
  });
  
  app.post('/login', checkNotLogin);
  app.post('/login', function(req, res) {
    //生成口令的散列值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');
    
    User.get(req.body.username, function(err, user) {
      if (!user) {
        req.flash('error', '用戶不存在');
        return res.redirect('/login');
      }
      if (user.password != password) {
        req.flash('error', '用戶口令錯誤');
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登入成功');
      res.redirect('/');
    });
  });
  
  app.get('/logout', checkLogin);
  app.get('/logout', function(req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
  });
  
  app.get('/u/:user', function(req, res) {
    User.get(req.params.user, function(err, user) {
      if (!user) {
        req.flash('error', '用戶不存在');
        return res.redirect('/');
      }
      Post.get(user.name, function(err, posts) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('user', {
          title: user.name,
          posts: posts,
        });
      });
    });
  });
  
  app.post('/post', checkLogin);
  app.post('/post', function(req, res) {
    var currentUser = req.session.user;
    var post = new Post(currentUser.name, req.body.post);
    post.save(function(err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success', '發表成功');
      res.redirect('/u/' + currentUser.name);
    });
  });
};

function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登入');
    return res.redirect('/login');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登入');
    return res.redirect('/');
  }
  next();
}
