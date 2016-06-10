/**
 * Created by Sylvanus on 5/25/16.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema ({
    from: String,
    to: String,
    message: String,
    time: Date,
    state: String   // delivered, read
});

module.exports.messageSchema = messageSchema;
