/**
 * Created by Sylvanus on 5/19/16.
 */

var express = require('express');
var router = express.Router();
var Models = require('../models/models');

var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/avatars')
    },
    filename: function (req, file, cb) {
        // file name bug
        cb(null, getUid(req))
    }
});
function fileFilter(req, file, cb) {
    var words = file.originalname.split('.');
    var extension = words.pop();
    if (extension != 'png' && extension != 'jpg' && extension != 'gif') {
        return cb(new Error('Only png jpg gif are allowed'))
    }
    cb(null, true);
}
var upload = multer({ storage: storage, fileFilter: fileFilter }).single('avatar');

router.get('/', function(req, res, next) {
    if (getDevice(req)) {
        console.log('mobile');
    } else {
        console.log('pc');
    }
    res.json({ 'name': 'sylvanus' });
});

router.post('/login', function(req, res, next) {});

router.post('/signup', function(req, res, next) {});

router.get('/checkEmail', function(req, res, next) {
    var User = Models.User;
    User.find({ email: req.query.uid }, function (err, docs) {
        if (docs.length>0) {
            res.json('taken');
        } else {
            res.json('valid');
        }
    });
});

router.get('/checkUsername', function(req, res, next) {
    var User = Models.User;
    User.find({ username: req.query.uid }, function (err, docs) {
        if (docs.length>0) {
            res.json('taken');
        } else {
            res.json('valid');
        }
    });
});

router.get('/getUserInfo', function(req, res, next) {
    var User = Models.User;
    User.find({ email: req.query.uid }, function (err, docs) {
        if (docs.length == 1) {
            res.json({
                email: docs[0].email,
                username: docs[0].username,
                avatar: docs[0].avatar,
                gender: docs[0].gender,
                birthday: docs[0].birthday,
                location: docs[0].location,
                whatsup: docs[0].whatsup
            });
        } else {
            console.log('find error in getUserInfo');
            res.redirect(303, '/login');
        }
    });
});

router.get('/getChatInfo', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.query.uid;
    if (friend == 'Validation@System'){
        var Request = Models.Request;
        Request.find({ to: user } , null, { sort: {time: -1} }, function (err, docs) {
            if (docs.length>0) {
                var unread = 0;
                docs.forEach(function (element) {
                    if (element.to == user && element.state == 'unread') {
                        unread++;
                    }
                });
                res.json({
                    message: docs[0].from+' wants to add you as a friend',
                    time: getDisplayTime(docs[0].time),
                    unread: unread
                });
            } else {
                console.log('find error in getRequestInfo');
            }
        });
    } else {
        var Message = Models.Message;
        Message.find({ $or: [{ from: user, to: friend }, { from: friend, to: user }] } , null, { sort: {time: -1} }, function (err, docs) {
            if (docs.length>0) {
                var unread = 0;
                docs.forEach(function (element) {
                    if (element.to == user && element.state == 'unread') {
                        unread++;
                    }
                });
                res.json({
                    message: docs[0].message,
                    time: getDisplayTime(docs[0].time),
                    unread: unread
                });
            } else {
                console.log('find error in getChatInfo');
            }
        });
    }
});

router.get('/getCurrentChat', function(req, res, next) {
    var User = Models.User;
    User.find({ email: req.session.uid }, 'talkWith', function (err, docs) {
        if (docs.length == 1) {
            res.json(docs[0].talkWith);
        } else {
            console.log('find error in getCurrentChat');
            res.redirect(303, '/login');
        }
    });
});

router.post('/removeChat', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.body.uid;
    var User = Models.User;
    User.update({ email: uid }, { $pull: { chats: friend } }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' remove the chat with '+friend);
    });
});

router.post('/checkMessage', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.body.uid;
    var User = Models.User;
    var Message = Models.Message;
    User.update({ email: uid }, { talkWith: friend }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' is now talk with '+friend);
    });
    Message.update({ from: friend, to: uid }, { state: 'read' }, { multi: true }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log('Messages from '+friend+' to '+uid+' is read');
    });
});

router.post('/checkRequest', function(req, res, next) {
    var uid = getUid(req);
    var User = Models.User;
    var Request = Models.Request;
    User.update({ email: uid }, { talkWith: 'System' }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' is now check system message');
    });
    Request.update({ to: uid, state: 'delivered' }, { state: 'read' }, { multi: true }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log('Requests to '+uid+' is read');
    });
});

router.get('/getChatMessage', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.query.uid;
    var Message = Models.Message;
    Message.find({ $or: [{ from: user, to: friend }, { from: friend, to: user }] } , null, { sort: {time: 1} }, function (err, docs) {
        var messages = [];
        docs.forEach(function(element) {
            messages.push({
                from: element.from,
                to: element.to,
                message: element.message,
                time: getMessageTime(element.time),
                state: element.state
            });
        });
        res.json({ messages: messages });
    });
});

router.get('/getFriendRequest', function(req, res, next) {
    var uid = getUid(req);
    var Request = Models.Request;
    Request.find({ to: uid } , null, { sort: {time: -1} }, function (err, docs) {
        var requests = [];
        docs.forEach(function(element) {
            requests.push({
                who: element.from,
                message: element.message,
                time: getDisplayTime(element.time),
                state: element.state
            });
        });
        res.json({ requests: requests });
    });
});

router.post('/acceptRequest', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.body.uid;
    var User = Models.User;
    var Request = Models.Request;
    // duplicate friend
    User.update({ email: uid }, { $push: { 'friends.0.items': friend } }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' has added '+friend+' as a friend');
    });
    User.update({ email: friend }, { $push: { 'friends.0.items': uid } }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(friend+' has added '+uid+' as a friend');
    });
    Request.update({ from: friend, to: uid }, { state: 'accepted' }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log('Request from '+friend+' to '+uid+' is accepted');
    });
});

router.post('/ignoreRequest', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.body.uid;
    var Request = Models.Request;
    Request.update({ from: friend, to: uid }, { state: 'ignored' }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log('Request from '+friend+' to '+uid+' is ignored');
    });
});

router.post('/addGroup', function(req, res, next) {
    var uid = getUid(req);
    var newGroup = req.body.newGroup;
    var User = Models.User;
    // duplicate group
    User.update({ email: uid }, { $push: { friends: { group: newGroup, items: [] }}}, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' add a new group '+newGroup);
    });
    res.json({ newGroup: newGroup });
});

router.post('/changeGroup', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.body.uid;
    var fromGroup = req.body.fromGroup;
    var toGroup = req.body.toGroup;
    var User = Models.User;
    User.update({ email: uid, 'friends.group': toGroup }, { $push: { 'friends.$.items': friend } }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' add '+friend+' to group '+toGroup);
    });
    User.update({ email: uid, 'friends.group': fromGroup }, { $pull: { 'friends.$.items': friend } }, function (err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' remove '+friend+' from group '+fromGroup);
    });
    res.json({ uid: friend, gid: toGroup });
});

router.post('/newChat', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.body.uid;
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
            User.findOneAndUpdate({ email: uid }, { chats: chats, talkWith: friend }, function(err, raw) {
                if (err)
                    console.error(error);
                console.log('The raw response from Mongo was ', raw);
                console.log(uid+' create a new chat with '+friend);
            });
            res.json('http://localhost:3000/conversation');
        } else {
            console.log('wrong email');
        }
    });
});

router.post('/deleteFriend', function(req, res, next) {
    var uid = getUid(req);
    var friend = req.body.uid;
    var User = Models.User;
    User.update({ email: uid, 'friends.group': req.body.gid }, { $pull: { 'friends.$.items': friend } }, function (err, raw) {
        if (err)
            console.error(err);
        console.log('The raw response from Mongo was ', raw);
        console.log(uid+' delete friend '+friend);
    });
    User.update({ email: friend }, { $pull: { 'friends.$.items': uid } }, function (err, raw) {
        if (err)
            console.error(err);
        console.log('The raw response from Mongo was ', raw);
        console.log(friend+' delete friend '+uid);
    });
    res.json({ uid: friend });
});

router.post('/uploadAvatar', function(req, res, next) {
    var uid = getUid(req);
    upload(req, res, function(err) {
        if (err) {
            console.error(err);
        }
        var User = Models.User;
        User.findOneAndUpdate({ email: uid }, { avatar: req.file.filename }, function(err, raw) {
            if (err)
                console.error(error);
            console.log('The raw response from Mongo was ', raw);
        });
    });
    if (!getDevice(req)) {
        res.redirect(303, '/profile');
    }
});

router.get('/getChatlistByToken', function(req, res, next) {
    var uid = req.query.token;
    var User = Models.User;
    User.find({ email: uid }, 'chats', function (err, docs) {
        if (docs.length == 1) {
            res.json({ chats: docs[0].chats });
        } else {
            console.log('wrong email');
        }
    });
});

router.get('/getFriendlistByToken', function(req, res, next) {
    var uid = req.query.token;
    var User = Models.User;
    User.find({ email: uid }, 'friends', function (err, docs) {
        if (docs.length == 1) {
            res.json({ friends: docs[0].friends });
        } else {
            console.log('wrong email');
        }
    });
});

router.get('/getGroupListByToken', function (req, res, next) {
    var uid = req.query.token;
    var User = Models.User;
    User.find({ email: uid }, 'friends', function (err, docs) {
        if (docs.length == 1) {
            var groups = [];
            var friends = docs[0].friends;
            friends.forEach(function (element) {
                groups.push(element.group);
            });
            res.json({ groups: groups });
        } else {
            console.log('wrong email');
        }
    });
});

router.post('/changeNicknameByToken', function(req, res, next) {
    var uid = req.body.token;
    var User = Models.User;
    User.findOneAndUpdate({ email: uid }, { name: req.body.name }, function(err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
    });
});

router.post('/changeGenderByToken', function(req, res, next) {
    var uid = req.body.token;
    var User = Models.User;
    User.findOneAndUpdate({ email: uid }, { gender: req.body.gender }, function(err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
    });
});

router.post('/changeBirthdayByToken', function(req, res, next) {
    var uid = req.body.token;
    var User = Models.User;
    User.findOneAndUpdate({ email: uid }, { birthday: req.body.birthday }, function(err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
    });
});

router.post('/changeLocationByToken', function(req, res, next) {
    var uid = req.body.token;
    var User = Models.User;
    User.findOneAndUpdate({ email: uid }, { location: req.body.location }, function(err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
    });
});

router.post('/changeWhatsupByToken', function(req, res, next) {
    var uid = req.body.token;
    var User = Models.User;
    User.findOneAndUpdate({ email: uid }, { whatsup: req.body.whatsup }, function(err, raw) {
        if (err)
            console.error(error);
        console.log('The raw response from Mongo was ', raw);
    });
});

router.post('/changePasswordByToken', function(req, res, next) {
    if (req.body.pwd1 != req.body.pwd2) {
        console.log('password not consist');
    } else {
        var uid = req.body.token;
        var User = Models.User;
        User.findOneAndUpdate({ email: uid }, { password: req.body.pwd1 }, function(err, raw) {
            if (err)
                console.error(error);
            console.log('The raw response from Mongo was ', raw);
        });
    }
});

router.post('/checkPasswordByToken', function(req, res, next) {
    var uid = req.body.token;
    var User = Models.User;
    User.find({ email: uid }, function (err, docs) {
        if (docs.length == 1) {
            if (docs[0].password == req.body.password) {
                res.json({ state: 'success' })
            } else {
                res.json({ state: 'fail' });
            }
        } else {
            console.log('wrong email');
        }
    });
});

function getDisplayTime(originalTime) {
    var timeNow = new Date();
    var displayTime;
    if (timeNow.toDateString() == originalTime.toDateString()) {
        displayTime = originalTime.getHours()+':'+originalTime.getMinutes();
    } else {
        displayTime = originalTime.getMonth()+'/'+originalTime.getDate();
    }
    return displayTime;
}

function getMessageTime(originalTime) {
    return originalTime.getHours()+':'+originalTime.getMinutes()+', '+originalTime.toDateString();
}

function getUid(req) {
    if (getDevice(req)) {
        return req.body.token;
    } else {
        return req.session.uid;
    }
}

function getDevice(req) {
    var deviceAgent = req.header('user-agent').toLowerCase();
    return deviceAgent.match(/(iphone|ipad|ipod|android)/);
}

module.exports = router;
