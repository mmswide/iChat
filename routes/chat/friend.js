/**
 * Created by Sylvanus on 4/3/16.
 */

var express = require('express');
var router = express.Router();
var Models = require('../../models/models');

router.get('/', function(req, res, next) {
    if (req.session.uid == null) {
        res.redirect('/login');
    }
    var User = Models.User;
    User.find({ email: req.session.uid }, 'friends', function (err, docs) {
        if (docs.length == 1) {
            var groups = [];
            var friends = docs[0].friends;
            friends.forEach(function(element) {
                groups.push(element.group);
            });
            res.render('chat/friend', {
                title: 'Contacts',
                friends: friends,
                groups: groups
            });
        } else {
            console.log('wrong email');
            res.redirect(303, '/login');
        }
    });
});

module.exports = router;
