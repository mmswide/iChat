/**
 * Created by Sylvanus on 5/11/16.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema ({
    active: Boolean,
    email: String,
    username: String,
    password: String,
    avatar: String,
    gender: String,
    birthday: String,
    location: String,
    whatsup: String,
    friends: Array,
    chats: Array,
    talkWith: String
});

module.exports.userSchema = userSchema;
