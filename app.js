var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
//var users = require('./routes/users');

var app = express();

var partials = require('express-partials');
var mysession = require('express-session');
var flash = require('connect-flash');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var MongoStore = require('connect-mongo')(mysession);
var settings = require('./settings');

// store session data in MongoDB
app.use(mysession({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: settings.cookieSecret,
    store: new MongoStore({
        db: settings.db
    })
}));


app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
});

app.use(function (req, res, next) {
    err = req.flash('error');
    if (err.length)
        res.locals.error = err;
    else
        res.locals.error = null;
    next();
});

app.use(function (req, res, next) {
    succ = req.flash('success');
    if (succ.length)
        res.locals.success = succ;
    else
        res.locals.success = null;
    next();
});

app.use(partials());

app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}



module.exports = app;