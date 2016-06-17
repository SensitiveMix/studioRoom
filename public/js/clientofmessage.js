/**
 * Created by Administrator on 2016/5/7.
 */
(function () {
    var d = document,
        w = window,
        p = parseInt,
        dd = d.documentElement,
        db = d.body,
        dc = d.compatMode == 'CSS1Compat',
        dx = dc ? dd : db,
        ec = encodeURIComponent;


    window.CHAT = {
        //获取message
        msgObj: d.getElementById("message"),
        //让滚动条滚到最底部
        scrollToBottom: function () {
            w.scrollTo(0, this.msgObj.clientHeight);
        },

        //退出，本例只是一个简单的刷新
        logout: function () {
            //this.socket.disconnect();
            location.reload();
        },

        messsgesubmit1: function () {
            this.socket = io.connect('ws://139.196.203.21:3000');
                var obj = {
                    date:$(this).parent().children('span').eq(0).text(),
                    content: $(this).parent().children('span').eq(1).text(),
                    level:$(this).parent().children('input').eq(0).val(),
                    ip:$(this).parent().children('input').eq(1).val(),
                    userid:$(this).parent().children('input').eq(2).val(),
                    msgid:$(this).parent().children('input').eq(3).val(),
                    username: $(this).parent().children('a').text()
                };

                $(this).parent().remove();
                this.socket.emit('message', obj);

            return false;
        },
        messsgecancel: function () {
            this.socket = io.connect('ws://139.196.203.21:3000');

            //level 78 代表删除
            var obj = {
                msgid:$(this).parent().children('input').eq(3).val(),
                level:78
            };

                $(this).parent().remove();
                this.socket.emit('message', obj);
            return false;
        },



        init: function () {


            /*
             客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
             实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
             */
            //连接websocket后端服务器
            this.socket = io.connect('ws://139.196.203.21:3000');

            //监听消息发送
            this.socket.on('checkmessages', function (obj) {

                var myDate = new Date();
                var isme = true;
               // var timeSpan = '<span class="a">' + myDate.getHours() + ':' + myDate.getMinutes() + '</span>';
                var timeSpan ='<span class="a" width="400px">' + obj.date + '</span>';
                var imgoflevel = '<img class="l" src="/images/' + obj.level + '.png">';
                var contentDiv = '<a class="u" name="u" >' + obj.username + '&nbsp&nbsp</a>';
                var usernameDiv = '<span class="b" name="b" >' + obj.content + '</span>';
                var userlevel = '<input class="le" value="' + obj.level + '" type="hidden" name="le" ></input>';
                var userip = '<input class="le1" value="' + obj.ip + '" type="hidden" name="le1" ></input>';
                var userid = '<input class="id" value="' + obj.userid + '" type="hidden" name="id" ></input>';
                var msgid='<input class="msgid" value="' + obj.msgid + '" type="hidden" name="msgid" ></input>';


                var button= d.createElement('input');
                button.className="message_update";
                button.onclick=CHAT.messsgesubmit1;
                button.setAttribute("type","button");
                button.setAttribute("value","通过");

                var cancel= d.createElement('input');
                cancel.className="message_update";
                cancel.onclick=CHAT.messsgecancel;
                cancel.setAttribute("type","button");
                cancel.setAttribute("value","驳回");

                var section = d.createElement('li');

                if (isme) {
                    section.className = 'user';
                    section.innerHTML = timeSpan + imgoflevel + contentDiv + usernameDiv+userlevel+userip+userid+msgid;
                } else {
                    section.className = 'service';
                    section.innerHTML = timeSpan + imgoflevel + contentDiv + usernameDiv+userlevel+userip+userid+msgid;
                }
                section.appendChild(button);
                section.appendChild(cancel);
                CHAT.msgObj.appendChild(section);


            });




        }
    };
    //通过“回车”提交信息
})();
