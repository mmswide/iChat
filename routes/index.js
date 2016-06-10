var express = require('express');
var router = express.Router();
var Models = require('../models/models');
var socketHandler = require('./socketHandler');

var session = require('express-session');
var sessionConf = session({
    secret: 'test',
    store: require('../models/models').sessionStore,
    cookie: { maxAge: 1000*60*60}
});

/* GET home page. */
router.get('/', function(req, res, next) {
  var id;
  if (req.session.uid) {
    id = req.session.uid;
    socketHandler.addUser(id);
  } else {
    res.redirect(303, '/login');
  }
  res.render('index', { 'ID': id });
});

module.exports = function(io) {
    var iosession = require('socket.io-express-session');
    io.use(iosession(sessionConf));

    io.on('connection', function(socket) {
        console.log('a user connected');
        console.log(socket.handshake.session.uid);
        console.log(socket.request._query.token);
        var Message = Models.Message;
        var Request = Models.Request;
        var uid;
        if (socket.request._query.token) {
            uid = socket.request._query.token;
        } else {
            uid = socket.handshake.session.uid;
        }
        if (uid) {
            socketHandler.addUser(uid);
            socketHandler.setSocket(uid, socket);
            Message.count({ to: uid, state: 'delivered' }, function (err, count) {
                if (err)
                    console.error(error);
                socket.emit('unread', count);
            });
        }

        socket.on('send', function(info) {
            console.log('receive chat from '+uid);
            console.log('msg: '+info.message);
            var time = new Date();
            Message.create({
                from: uid,
                to: info.to,
                message: info.message,
                time: time,
                state: 'delivered'
            }, function(error) {
                console.log('saved');
                if (error) {
                    console.error(error);
                }
            });
            sendMessage(uid, info.to, info.message, time);
        });

        socket.on('request', function(request) {
            console.log('receive request from '+uid);
            var time = new Date();
            Request.create({
                from: uid,
                to: request.uid,
                message: request.message,
                time: time,
                state: 'delivered'
            }, function(error) {
                console.log('saved');
                if (error) {
                    console.error(error);
                }
            });
            sendRequest(uid, request.uid, request.message, time);
        });

        socket.on('disconnect', function(){
            socketHandler.deleteSocket(uid);
            console.info('user disconnected');
        });

        function sendMessage(from, to, message, time) {
            updateChatList(from, to);
            updateChatList(to, from);
            socket.emit('newMessage', {
                uid: to,
                who: from,
                message: message,
                time: time.getHours()+':'+time.getMinutes()
            });
            var toUser = socketHandler.userOfID(to);
            if (toUser) {
                toUser.socket.emit('newMessage', {
                    uid: from,
                    who: from,
                    message: message,
                    time: time.getHours()+':'+time.getMinutes()
                });
            } else {
                console.log('no receiver');
            }
        }

        function sendRequest(from, to, message, time) {
            updateChatList(to, 'Validation@System');
            var toUser = socketHandler.userOfID(to);
            if (toUser) {
                toUser.socket.emit('newRequest', {
                    who: from,
                    message: message,
                    time: time.getHours()+':'+time.getMinutes()
                });
            } else {
                console.log('no receiver');
            }
        }

        function updateChatList(uid, friend) {
            var User = Models.User;
            User.find({ email: uid }, 'chats', function (err, docs) {
                if (docs.length == 1) {
                    var chats = docs[0].chats;
                    for (var i=0; i<chats.length; i++) {
                        if (chats[i] == friend) {
                            chats.splice(i, 1);
                            break;
                        }
                    }
                    chats.unshift(friend);
                    User.findOneAndUpdate({ email: uid }, { chats: chats }, function(err, raw) {
                        if (err)
                            console.error(error);
                        console.log('The raw response from Mongo was ', raw);
                        console.log('Chat list of '+uid+' is updated');
                    });
                } else {
                    console.log('wrong email');
                }
            });
        }
    });

    return router;
};

module.exports.sessionConf = sessionConf;
