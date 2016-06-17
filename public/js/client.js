(function () {
    var d = document,
        w = window,
        p = parseInt,
        dd = d.documentElement,
        db = d.body,
        dc = d.compatMode == 'CSS1Compat',
        dx = dc ? dd : db,
        ec = encodeURIComponent;


    w.CHAT = {
        msgObj: d.getElementById("message"),
        screenheight: w.innerHeight ? w.innerHeight : dx.clientHeight,
        username: null,
        userid: null,
        fkid:null,
        socket: null,
        level: null,
        flag:0,
        //让浏览器滚动条保持在最低部
        scrollToBottom: function () {
            w.scrollTo(0, this.msgObj.clientHeight);
        },
        //退出，本例只是一个简单的刷新
        logout: function () {
            //this.socket.disconnect();
            location.reload();
        },
        //提交聊天消息内容
        submit: function (type) {
            var content = d.getElementById("Y_iSend_Input").value;
            if(content==""&&type!="xianhua"){
                alert('发送内容不能为空！');
                return false;
            }
            if($.cookie('flag')==1){
            alert('发言过快，请稍后再试！');
                return false;
            }
            var myDate1 = new Date();
            myDate1.setTime(myDate1.getTime() + (5000));//coockie保存一小时
            $.cookie('flag','1', { expires:myDate1 });

            var myDate = new Date();
            var msgid=myDate.getTime() + "" + Math.floor(Math.random() * 899 + 100);
            var sendTime = myDate.getFullYear()+"年-"+(myDate.getMonth()+1)+"月"+myDate.getDate()+"日"+myDate.getHours()+":"+myDate.getMinutes()+":"+myDate.getSeconds();
            if (content != ''||type!="") {
                var obj = {
                    msgid:msgid,
                    userid: this.userid,
                    username: this.username,
                    content: content,
                    sendto:null,
                    type:0,
                    sendtoname:null,
                    level: this.level,
                    belong:this.belong,
                    sendtime:sendTime
                };
                if(type=="xianhua"){
                obj.type="xianhua";
                }
                //查看自己的聊天
                $("#Y_PubMes_Div").mCustomScrollbar('update');
                $("#Y_PubMes_Div").mCustomScrollbar("scrollTo", "last");
                //this.socket.emit('message', obj);
                this.socket.emit('message', obj);
                d.getElementById("Y_iSend_Input").value = '';
            }
            return false;
        },
        genUid: function () {
            return new Date().getTime() + "" + Math.floor(Math.random() * 899 + 100);
        },
        //更新系统消息，本例中在用户加入、退出的时候调用
        updateSysMsg: function (o, action) {
            //当前在线用户列表
            var onlineUsers = o.onlineUsers;
            //当前在线人数
            var onlineCount = o.onlineCount;
            //新加入用户的信息
            var user = o.user;

            //更新在线人数
            var userhtml = '';
            var separator = '';
            var userAp = '';
            for (key in onlineUsers) {
                if (onlineUsers.hasOwnProperty(key)) {
                    userAp += '<li><a><img width="25px" src="/images/' + onlineUsers[key].level + '.png"/><span>' + onlineUsers[key].nick_name + '</span></a></li>';
                    //userAp += '<li><div class="UBase"><img class="USoundStatus" src="/images/pixel.gif"><img class="US_Pic" src="/images/201509070905306991.jpg"><span title="" class="UName" href="javascript:void(0)">'+onlineUsers[key].nick_name+'</span><img class="RoomUserRole RoomUser2" title="普通客户：可文字发言" src="/images/'+onlineUsers[key].level+'.png"></div></li>';
                }
            }// d.getElementById("onlinecount").innerHTML = '当前共有 '+onlineCount+' 人在线，在线列表：'+userhtml;
            $('#User_List').html(userAp);
            $("#userlist").mCustomScrollbar('update');
            $("#userlist").mCustomScrollbar("scrollTo", "last");
            //添加系统消息
            var html = '';
            html += '<li class="chatli"><span class="b">'
            html += o.user.nick_name;
            html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
            html += '</span></li>';
            var li = d.createElement('li');
            li.className = 'system J-mjrlinkWrap J-cutMsg';
            li.innerHTML = html;
           // this.msgObj.appendChild(li);
        },
        //第一个界面用户提交用户名
        usernameSubmit: function () {
            var username = this.genUid();
            if (username != "") {
                /*d.getElementById("username").value = '';
                 d.getElementById("loginbox").style.display = 'none';
                 d.getElementById("chatbox").style.display = 'block';*/
                this.init(username);
            }
            return false;
        },
        delmesli:function(str){
            this.socket.emit('delmessage', str);
            //$("#message").find("li[title="+str+"]").remove();
        },
        biaoqing:function(str){
            str = str.replace(/\</g,'&lt;');
            str = str.replace(/\>/g,'&gt;');
            str = str.replace(/\n/g,'<br/>');
            str = str.replace(/\[em_([0-9]*)\]/g,'<img src="arclist/$1.gif" border="0" />');
            return str;
        },
        //初始化，页面加载时调用
        init: function (username) {
            if($("#userlevel").val()=="77")
                {
                    //获取缓存中的ID和访客ID
                    this.fkid= $.cookie('fkid');
                    this.userid= $.cookie('userid');
                    //没有缓存赋值
                    if (this.userid==null||this.userid=="")
                    {
                        this.userid=new Date().getTime() + "" + Math.floor(Math.random() * 899 + 100);
                        this.fkid=Math.floor(Math.random()*900);
                        //如果没有缓存，存入，过期时间7天
                        $.cookie('userid',this.userid, { expires: 7 });
                        $.cookie('fkid',this.fkid, { expires: 7 });
                        //document.cookie='userid='+this.userid+';fkid='+this.fkid;
                    }
                    //存入前端页面
                    $("#unn").text("游客_"+this.fkid);
                    $("#userid").val(this.userid);
                    this.username="游客_"+this.fkid;

                }else{
                    this.userid = $("#userid").val();
                    this.username = $('#unn').text();

                }
            this.level = $('#userlevel').val();
            //连接websocket后端服务器
            this.socket = io.connect('ws://localhost:3000');

            //告诉服务器端有用户登录
            this.socket.emit('login', {_id: this.userid, nick_name: this.username, level: this.level});

            //监听新用户登录
            this.socket.on('login', function (o) {
                CHAT.updateSysMsg(o, 'login');
            });

            //监听用户退出
            this.socket.on('logout', function (o) {
                CHAT.updateSysMsg(o, 'logout');
            });
            //監聽公告
            this.socket.on('fabugonggao', function (obj) {
                //alert(obj.gonggao);
                $("#gonggao").html(obj.gonggao);
                $("#gundongspan").html(obj.gonggao);
            });
            //监听喊单
            this.socket.on('fabuhandan', function (obj) {
                //alert(obj.dkqs);
                $("#dkqs").html(obj.dkqs);
                $("#kcdw").html(obj.kcdw);
                $("#pcdw").html(obj.pcdw);
                $("#zsdw").html(obj.zsdw);
                $("#zydw").html(obj.zydw);
                $("#bz").html(obj.bz);
                $("#hduser").html(obj.hduser);
                $("#hdtime").html(obj.hdtime);
            });
            //删除发送消息
            this.socket.on('delmessage', function (obj) {
                $("#message").find("li[title="+obj+"]").remove();
            });
            //监听消息发送
            this.socket.on('message', function (obj) {
                var myDate = new Date();


                var isme = (obj.userid == CHAT.userid) ? true : false;

                //var newdate=obj.date.substring(obj.date.indexOf("日")+1,obj.date.length);
               // var islocal = (obj.ip == serverip) ? false : true;
                var timeSpan = '<span>'+ myDate.getHours() + ':' + myDate.getMinutes() + '</span>';
                var imgoflevel = '<img class="Role Manager2" src="/images/' + obj.level + '.png">';
                var contentDiv = '<a>' + obj.username + '：</a>';
                var usernameDiv ="";
                if(obj.type=="xianhua"){
                    usernameDiv = '<p><img src="/images/xh.gif"/>';
                }else{
                usernameDiv = '<p>' + CHAT.biaoqing(obj.content);
                }
                if(CHAT.level==66){
                    var ojjb = obj.msgId;
                    usernameDiv+="<img src='/images/laji.png' onclick=CHAT.delmesli('"+obj.msgid+"') value=''/>";
                }
                usernameDiv+= '</p>';
                var section = d.createElement('li');
                section.title=obj.msgid;
                {
                    if (isme) {
                        section.className = 'user';
                        section.innerHTML = timeSpan + imgoflevel + contentDiv + usernameDiv;

                    } else {
                        section.className = 'service';
                        section.innerHTML = timeSpan + imgoflevel + contentDiv + usernameDiv;

                    }
                }
                CHAT.msgObj.appendChild(section);
                $("#Y_PubMes_Div").mCustomScrollbar('update');
                $("#Y_PubMes_Div").mCustomScrollbar("scrollTo", "last");
            });

        }
    };

    //通过“回车”提交信息
    d.getElementById("Y_iSend_Input").onkeydown = function (e) {
        e = e || event;
        if (e.keyCode === 13) {
            CHAT.submit();
        }
    };
})();