/**
 * Created by Sylvanus on 3/22/16.
 */

var express = require('express');
var router = express.Router();
var Models = require('../models/models');

router.get('/', function(req, res, next) {
    res.render('signup', { title: 'Sign up' });
});

router.post('/process', function(req, res, next) {
    var pwd1 = req.body.pwd1;
    var pwd2 = req.body.pwd2;
    if (pwd1 != pwd2) {
        res.redirect(303, '/signup');
    } else {
        var group = [];
        var User = Models.User;
        User.create({
            email: req.body.email,
            username: req.body.username,
            password: pwd1,
            avatar: 'unknown',
            friends: [{ group: 'My friends', items: [] }]
        }, function(error) {
            console.log('saved');
            if (error) {
                console.error(error);
            }
        });
        req.session.uid = req.body.email;
        res.redirect(303, '/conversation');
    }
});

module.exports = router;
