var express = require('express');
var router = express.Router();
var http = require('http').Server(express);
var io = require('socket.io')(http);
var formidable = require('formidable');
var crypto = require('crypto');
var fs = require('fs');
var db = require('../model/index');
var app = express();
var r = [];
var u = [];
var leverlist = [];
/* GET users listing. */

//上传文件
router.post('/doupload', function (req, res) {
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';		//设置编辑
    form.uploadDir = 'public' + '/upload/';	 //设置上传目录
    form.keepExtensions = true;	 //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
    form.parse(req, function (err, fields, files) {

        if (err) {
            res.locals.error = err;
            res.end();
            return;
        }

        var extName = '';  //后缀名
        switch (files.fulAvatar.type) {
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
        fs.renameSync(files.fulAvatar.path, newPath);  //重命名
    });

    res.locals.success = '上传成功';
});

//后台登录界面
router.get('/login', function (req, res, next) {
    console.log("后台登录界面");

        db.options.find({'option_name': 'sysset'}, function (err, result) {
            req.session.sysset = result[0];
            res.render('room/login', {sysset:  req.session.sysset, jiaoben: ""});
            console.log("sysyset")
        });
    // leverlist = result[0].level;
});
var checkLogin = function (req, res, next) {
    if (  req.session.userinfo.length == 0) {
        res.render("404");
    }
    next();
};
//检查权限
function checkrole(list, rolename) {
    for (key in list) {
        if (list[key].rolename == rolename) {
            console.log("拥有权限" + rolename)
            return true;
        } else {
            continue;
        }
    }
    return false;
}
//MD5加密
function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
};
//后台登陆处理
router.post('/doadminlogin', function (req, res, next) {
    newpassword = md5(req.body.password);
    var query = {name: req.body.name, password: newpassword};
    db.users.find(query, function (err, result) {
        if (result.length == 1) {
            req.session.userinfo = result[0];
            if (checkrole(result[0].role, "登录后台")) {
                console.log(result[0].nick_name + ":登录成功" + new Date());
                res.render('admin/index', {username:  req.session.userinfo.nick_name, sysset:  req.session.sysset});
            } else {
                console.log(result[0].nick_name + ":权限不足，登录失败" + new Date());
                res.render('room/login', {sysset:  req.session.sysset, jiaoben: 'layer.tips("权限不足，登录失败！", $("#Name1"));'});
            }
        } else {
            console.log(query.name + ":登录失败" + new Date());
            res.render('room/login', {sysset:  req.session.sysset, jiaoben: 'layer.tips("账户或密码错误！", $("#Name1"));'});
        }
    });
});

//基本设置-直播室名称
router.post('/dosysset', checkLogin);
router.post('/dosysset', function (req, res, next) {
    db.options.findOneAndUpdate({option_name: 'sysset'}, {
        $set: {
            room_name: req.body.room_name,
            room_logo: req.body.imgoflogo,
            gundonggonggao: req.body.gundonggonggao,
            jianjie: req.body.jianjie
        }
    }, function (err, result) {
        // r=result;
        res.end();
    });

});
//跳转页面-基本设置
router.get('/mainset', checkLogin);
router.get('/mainset', function (req, res, next) {
    console.log("基本设置页面" + new Date());
    db.options.find({'option_name': 'sysset'}, function (err, result) {
        //  console.log("登录界面");
        r = result;
        res.render('admin/index', {username:   req.session.userinfo.nick_name, sysset: result[0]});
        //   leverlist=result[0].level;
        // console.log(leverlist);
        //  res.render('room/login_2', { title: r[0].option_value[0].room_name,mes:'',scji:''});
    });
    console.log("基本设置成功" + r);
});
//跳转页面-机器人设置
router.get('/robotlist', function (req, res, next) {
    console.log("机器人设置" + new Date());
    console.log(leverlist);
    res.render('admin/robotlist', {username:   req.session.userinfo.nick_name, sysset:  req.session.sysset});
});
//修改机器人
router.post('/dochangeRobot', checkLogin);
router.post('/dochangeRobot', function (req, res, next) {
    console.log("机器人修改" + new Date());
    console.log(req.body.levelname);
    db.users.update({_id: req.body.robotid}, {
        $set: {
            nick_name: req.body.robotnamne,
            level: req.body.level,
            levelname: req.body.levelname,
            usertype: 0
        }
    }, function (err) {
        res.end();
    });
});
//删除机器人
router.post('/dodelRobote', checkLogin);
router.post('/dodelRobote', function (req, res, next) {
    console.log("机器人删除" + new Date());
    db.users.remove({_id: req.body.roboteid}, function (err) {
        res.end();
    });
});
//添加机器人
router.post('/doaddRobot', function (req, res, next) {
    console.log("机器人添加" + req.body.addName + new Date());
    var doc = {nick_name: req.body.addName, level: req.body.addLevel, levelname: req.body.addLevelName, usertype: 0};
    var robot = new db.users(doc);
    robot.save(function (err) {
        if (err) // ...
            console.log('meow');
        res.end();
    });
});
//显示所有机器人
router.get('/dorobotelist', function (req, res, next) {
    console.log("当前分页" + req.query.iDisplayStart);
    db.users.find({usertype: '0'}, function (err, result) {
        var lista = {
            "draw": 2,
            "recordsTotal": "",
            "recordsFiltered": "",
            "data": []
        };
        lista.recordsTotal = result.length;
        lista.recordsFiltered = lista.recordsTotal;
        lista.data = result;
        res.send(lista);
        res.end();
    });

});
//跳转页面-用户管理
router.get('/userlist', function (req, res, next) {
    console.log("用户设置" + new Date());
    console.log(leverlist);
    res.render('admin/userlist', {username:   req.session.userinfo.nick_name, sysset:  req.session.sysset});
});
//显示所有用户
router.get('/douserlist', function (req, res, next) {
    console.log("当前分页" + req.query.iDisplayStart);
    db.users.find({usertype: '1'}, function (err, result) {
        var lista = {
            "draw": 2,
            "recordsTotal": "",
            "recordsFiltered": "",
            "data": []
        };
        lista.recordsTotal = result.length;
        lista.recordsFiltered = lista.recordsTotal;
        lista.data = result;
        res.send(lista);
        res.end();
    });

});
//删除用户
router.post('/dodeluser', checkLogin);
router.post('/dodeluser', function (req, res, next) {
    console.log("用户删除" + new Date());
    db.users.remove({_id: req.body.userid}, function (err) {
        res.end();
    });
});
//添加用户
router.post('/doadduser', function (req, res, next) {
    console.log("用户添加" + req.body.addName + new Date());
    var doc = {
        name: req.body.addname,
        password: req.body.addpassword,
        mobile: req.body.addmobile,
        nick_name: req.body.addnickname,
        level: req.body.addLevel,
        levelname: req.body.addLevelName,
        usertype: 1
    };
    doc.password = md5(doc.password);
    var robot = new db.users(doc);
    robot.save(function (err) {
        if (err) // ...
            console.log('meow');
        res.end();
    });
});
//修改用户
router.post('/dochangeUser', checkLogin);
router.post('/dochangeUser', function (req, res, next) {
    console.log("用户修改" + new Date());
    console.log(req.body.levelname);
    db.users.update({_id: req.body.robotid}, {
        $set: {
            password: req.body.updpass,
            mobile: req.body.updmobile,
            nick_name: req.body.updnicname,
            level: req.body.level,
            levelname: req.body.levelname
        }
    }, function (err) {
        res.end();
    });
});
//課程表顯示
router.get('/lessonlist', function (req, res, next) {
    console.log("课程表页面" + new Date());
    res.render('admin/lessonlist', {username:   req.session.userinfo.nick_name, sysset:  req.session.sysset});
});
//课程表
router.post('/dochangelesson', checkLogin);
router.post('/dochangelesson', function (req, res, next) {
    db.options.update({option_name: 'sysset'}, {$set: {lesson: req.body.lesson}}, function (err) {
    });
    res.end();
});
//喊单
router.get('/addhandan', checkLogin);
router.get('/addhandan', function (req, res, next) {
    res.render('admin/addhandan', {username:   req.session.userinfo.nick_name, sysset:  req.session.sysset});
});
router.post('/dohandan', function (req, res, next) {
    db.options.update({option_name: 'sysset'}, {
        $set: {
            newhandan: [{
                dkqs: req.body.dkqs,
                kcdw: req.body.kcdw,
                pcdw: req.body.pcdw,
                zsdw: req.body.zsdw,
                zydw: req.body.zydw,
                bz: req.body.bz,
                hduser: req.body.hduser,
                hdtime: req.body.hdtime
            }]
        }
    }, function (err) {
        // r=result;
    });
    res.end();
});
//聊天记录
router.get('/messagelist', checkLogin);
router.get('/messagelist', function (req, res, next) {
    res.render('admin/messagelist', {username:  req.session.userinfo.nick_name, sysset: req.session.sysset});
});
router.get('/findmessages', function (req, res, next) {
    console.log("基本设置页面" + new Date());
    db.messages.find( function (err, result) {
        var lista = {
            "draw": 2,
            "recordsTotal": "",
            "recordsFiltered": "",
            "data": [{}]
        };
        lista.recordsTotal = result.length;
        lista.recordsFiltered = lista.recordsTotal;
        lista.data = result;
        console.log(result);
        res.send(lista);
        res.end();
    });
    console.log("基本设置成功" + r);
});
//課程表顯示
router.post('/wenzhanglist', checkLogin);
router.get('/wenzhanglist', function (req, res, next) {
    console.log("文章列表" + new Date());
    db.wenzhanglists.find({status: 0}, function (err, result) {
        res.render('admin/wenzhanglist', {username:   req.session.userinfo.nick_name, sysset:  req.session.sysset, wenzhanglists: result});
    });

});
//添加文章显示
router.get('/addwenzhang', function (req, res, next) {
    console.log("添加文章" + new Date());
    res.render('admin/addwenzhang', {username:   req.session.userinfo.nick_name, sysset:  req.session.sysset});

});
//添加文章方法
router.post('/doaddwenzhang', checkLogin);
router.post('/doaddwenzhang', function (req, res, next) {
    console.log("用户添加" + req.body.cat + new Date());
    var cat = req.body.cat.split(",");
    console.log(cat);
    var doc = {
        title: req.body.title,
        content: req.body.content,
        cat: cat,
        meta:[{"key":"fxslevel","value":req.body.meta}],
        splink:req.body.splink,
        tupian: req.body.tupian,
        author: req.body.author,
        date: req.body.date,
        status: 0
    };
    var robot = new db.wenzhanglists(doc);
    robot.save(function (err) {
        if (err) // ...
            console.log('err:save wenzhang');
        res.end();
    });
});
router.get('/dodeletewenzhang/:id',function(req,res,next){
   console.log( req.params.id);
    db.wenzhanglists.remove({_id: req.params.id}, function (err) {
        res.redirect('/admin/wenzhanglist');
    });
})
module.exports = router;


