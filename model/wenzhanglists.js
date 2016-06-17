/**
 * Created by Administrator on 2016/5/9.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var wenzhangScheMa = new Schema({
    title: String,
    content:String,
    cat: [String],
    tupian:String,
    author: String,
    meta:[{key:String,value:String}],
    date:String,
    splink:String,
    status:String
});
module.exports = wenzhangScheMa;