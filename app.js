var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var session = require('express-session');
var socketio = require('socket.io');

var app = express();

// Socket.io
var io = socketio();
app.io = io;

var routes = require('./routes/index')(io);
var signup = require('./routes/signup');
var login = require('./routes/login');
var profile = require('./routes/chat/profile');
var conversation = require('./routes/chat/conversation');
var friend = require('./routes/chat/friend');
var api = require('./routes/api');
var users = require('./routes/users');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('./routes/index').sessionConf);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/signup', signup);
app.use('/login', login);
app.use('/profile', profile);
app.use('/conversation', conversation);
app.use('/friend', friend);
app.use('/api', api);
app.use('/users', users);

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

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
