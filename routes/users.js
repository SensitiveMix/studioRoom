var express = require('express');
var router = express.Router();
var http = require('http').Server(express);
var crypto = require('crypto');
var formidable = require('formidable');
var fs = require('fs');
var db = require('../model/index');
var r, u, leverlist = [];
var q = require("promise");
/* GET home page. */
router.get('/', function (req, res, next) {
    var fangke = {
        nick_name: "",
        _id: "",
        level: "77"
    };
    var p1 =db.wenzhanglists.find(function (err, resll) {}).exec();
    p1.then(function(data2){
        if (req.session.sysset == "" || req.session.sysset == null) {
            db.options.find({'option_name': 'sysset'}, function (err, result) {
                console.log("获取到系统信息,请求地址'/'");
                req.session.sysset = result[0];
                console.log(data2);
                //var id=Math.floor(Math.random()*900);
                //跳过
                res.render('room/index_1', {user: fangke, sysset: result[0], resll:data2});
                // res.render('room/login_1', {title: r[0].option_value[0].room_name, mes: '', scji: ''});
            });
        } else {
            res.render('room/index_1', {user: fangke, sysset: req.session.sysset, resll: data2});
        }
    })



});
//上传文件
router.post('/doupload', function (req, res) {
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';		//设置编辑
    form.uploadDir = '/public' + '/upload/';	 //设置上传目录
    form.keepExtensions = true;	 //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.locals.error = err;
            res.end();
            return;
        }
        var extName = '';  //后缀名
        switch (files.upload.type) {
            case 'image/pjpeg':
                extName = 'jpg';
                break;
            case 'image/jpeg':
                extName = 'jpg';
                break;
            case 'image/png':
                extName = 'png';
                break;
            case 'image/x-png':
                extName = 'png';
                break;
        }
        if (extName.length == 0) {
            res.locals.error = '只支持png和jpg格式图片';
            res.end();
            return;
        }
        var avatarName = Math.random() + '.' + extName;
        var newPath = form.uploadDir + avatarName;
        var savePath = '/upload/' + avatarName;
        res.json(savePath);
        res.end();
        console.log(savePath);
        try {
            fs.renameSync(files.upload.path, newPath);  //重命名
        } catch (e) {
            console.log(e);
        }
    });
    res.locals.success = '上传成功';
});
//前台登录界面
router.get('/login', function (req, res, next) {
    if (req.session.sysset == "" || req.session.sysset == null) {
        db.options.find({'option_name': 'sysset'}, function (err, result) {
            req.session.sysset = result[0];
        });
    }
    res.render('room/login_1', {sysset: req.session.sysset, jiaoben: ""});
});
//MD5加密
function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
};
//登录处理
router.post('/dologin', function (req, res, next) {
    newpassword = md5(req.body.password);
    var query = {name: req.body.name, password: newpassword};
    db.users.find(query).exec(function(err,result){
        if(result.length==1){
            db.wenzhanglists.find(function (err, resll) {
            if (req.session.sysset == "" || req.session.sysset == null) {
              db.options.find({'option_name': 'sysset'}).exec(
                  function(err,name){
                      console.log(query.name + "登录成功" + name);
                      req.session.sysset = name[0];
                      res.render('room/index_1', {user: result[0], sysset: req.session.sysset,resll: resll});
                  }
              );
            }else{
                res.render('room/index_1', {user: result[0], sysset: req.session.sysset,resll: resll});
            }
            });
        }else{
            console.log(query.name + ":登录失败" + new Date());
            res.render('room/login_1', {
                sysset: req.session.sysset,
                jiaoben: 'layer.tips("账户或密码错误！", $("#Name1"));'
            });
        }
    });
});

//exports.getroblist =getRobot();
module.exports = router;