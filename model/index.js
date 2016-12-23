/**
 * Created by XYJ on 2016/2/26 0026.
 */
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://127.0.0.1:27017/liveyb',function(err){console.log(err)});
exports.users = mongoose.model('users', require('./user'));
exports.options = mongoose.model('options', require('./options'));
exports.handan = mongoose.model('handan', require('./handan'));
exports.messages = mongoose.model('messages', require('./messages'));
exports.wenzhanglists = mongoose.model('wenzhanglists', require('./wenzhanglists'));
