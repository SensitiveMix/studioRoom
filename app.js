var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var admin = require('./routes/admin');
var app = express();
var http = require('http').Server(express);
var io = require('socket.io')(http);
var db = require('./model/index');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs-mate'));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret:'secret',
    resave:true,
    saveUninitialized:false,
    cookie:{
        maxAge:1000*60*10  //过期时间设置(单位毫秒)
    }
}));
app.use(function(req, res, next){
    res.locals.user = req.session.user;
    var err = req.session.error;
    res.locals.message = '';
    if (err) res.locals.message = '<div style="margin-bottom: 20px;color:red;">' + err + '</div>';
    next();
});

app.use('/', users);
app.use('/users', users);
app.use('/admin', admin);

onlineUsers ={};
onlineCount=[];
flag=0;
//通信处理
io.on('connection', function (socket) {
    console.log('a user connected');
    //监听新用户加入
    socket.on('login', function (obj) {
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket.name = obj._id;
        if(flag==0){
        var promis = db.users.find({usertype: '0'}, function (err, result){}).exec();
        promis.then(
            function(result) {
              for(key in result){
                  if (!onlineUsers.hasOwnProperty(result[key]._id)) {
                      onlineUsers[result[key]._id] = {nick_name: result[key].nick_name, level: result[key].level};
                      //在线人数+1
                      onlineCount++;
                  }
              }
                flag=1;
            },
            function(err) {
                console.log("find robote err");
            }
        )
        }
        //检查在线列表，如果不在里面就加入
        if (!onlineUsers.hasOwnProperty(obj._id)) {
            onlineUsers[obj._id] = {nick_name: obj.nick_name, level: obj.level};
            //在线人数+1
            onlineCount++;
        }
        console.log("find robote list success");
        //向所有客户端广播用户加入
        io.emit('login', {onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj});
        console.log(obj.nick_name + '加入聊天室');


    });

    //监听用户退出
    socket.on('disconnect', function () {
        //将退出的用户从在线列表中删除
        if (onlineUsers.hasOwnProperty(socket.name)) {
            //退出用户的信息
            var obj = {userid: socket.name, nick_name: onlineUsers[socket.name].nick_name};

            //删除
            delete onlineUsers[socket.name];
            //在线人数-1
            onlineCount--;

            //向所有客户端广播用户退出
            io.emit('logout', {onlineUsers: onlineUsers, onlineCount: onlineCount, user: obj});
            console.log(obj.username + '退出了聊天室');
        }
    });

    //发布公告
    socket.on('fabugonggao', function (obj) {
        io.emit('fabugonggao', obj);
        console.log(obj.gonggao);
    });
    //发布喊单
    socket.on('fabuhandan', function (obj) {
        io.emit('fabuhandan', obj);
        console.log(obj);
    });
//删除消息
    socket.on('delmessage', function (obj) {
        io.emit('delmessage', obj);
        console.log(obj);
    });

    //监听用户发布聊天内容
    socket.on('message', function (obj) {
        //向所有客户端广播发布的消息
        // obj.username = u.nick_name;
        // obj.level = u.level;
        var robot = new db.messages(obj);
        robot.save(function (err) {
            if (err) // ...
                console.log('meow');
        });
        io.emit('message', obj);
        console.log(obj.username + '说：' + obj.content);
    });

});
//获取机器人列表
http.listen(3000, function () {
    console.log('listening on *:3001');
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
