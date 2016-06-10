/**
 * Created by Sylvanus on 3/22/16.
 */

var express = require('express');
var router = express.Router();
var Models = require('../models/models');

router.get('/', function(req, res, next) {
    res.render('login', { title: 'Log in' });
});

router.post('/process', function(req, res, next) {
    var uid = req.body.uid;
    var password = req.body.password;
    var query;
    if (uid.indexOf('@') == -1) {
        query = {username: uid};
    } else {
        query = {email: uid};
    }

    var User = Models.User;
    User.find(query, function (err, docs) {
        if (docs.length == 1) {
            if (password == docs[0].password) {
                console.log('log in');
                req.session.uid = docs[0].email;
                res.redirect(303, '/conversation');
            } else {
                console.log('wrong password');
                res.redirect(303, '/login');
            }
        } else {
            console.log('wrong email');
            res.redirect(303, '/login');
        }
    });
});

module.exports = router;
