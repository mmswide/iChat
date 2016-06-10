/**
 * Created by Sylvanus on 5/27/16.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var requestSchema = new Schema ({
    from: String,
    to: String,
    message: String,
    time: Date,
    state: String   // delivered, read, accepted, ignored
});

module.exports.requestSchema = requestSchema;
