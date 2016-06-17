/**
 * Created by XYJ on 2016/2/26 0026.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var messageScheMa = new Schema({
    userid: String,
    username: String,
    content:  String,
    sendto: String,
    sendtoname: String,
    level:  String,
    belong: String,
    sendtime:String
});
module.exports = messageScheMa;