'use strict';
const _ = require('lodash');
const co = require('co');
const Socket = require('socket.io');
const session = require('./session');
const models= require('./models');
const cfg = require("../config");
const gameTimer = cfg.gametimer;



//解析答案（"ABC"=>["A","B","C"]）
function generateAnswer(ans){
    let ansArr = ans.toUpperCase().split("").sort();
    let tmpStr ="";
    ansArr.forEach(function(a){
        if(tmpStr.indexOf(a)< 0){
            tmpStr+=a;
        }
    });
    return tmpStr;
}

var server = null;

//群发
function sendToAll(_type,_msg){
    if(server){
        //console.log("To All   ["+_type+"]:"+JSON.stringify(_msg));
        server.emit(_type,_msg);
    }
}

//关闭服务器
exports.close = ()=>{
    if(server){
        sendToAll("shutdown");
        server.close();
        server = null;
    }
};

//启动服务器
exports.start = function(app){
    server =Socket(app);

    var $allTime = {};
    $allTime["comming"] = gameTimer.comming.value || 9 ; // 开始倒计时
    $allTime["vying"] =  gameTimer.vying.value || 3;//抢答倒计时时间
    $allTime["answering"] =  gameTimer.answering.value || 20;//抢答答题时间
    $allTime["showing"] =  gameTimer.showing.value || 3; //答案显示时间

    //全局对象，所有数据均可发往客户端，不能发的单独存储
    var $state$ = {};

    //服务器状态
    var $curQuest = null;//当前题目带答案

    //var $vied = false;  //抢答是否开始
    var $users$ = {}; //用户表

    var $questIdArr=[]; //问题ID数组,选择题库后读取数据库


    /**************** 定时器*******************/
    var timerType = "";//倒计时类型   //  comming   vying  answering  showing
    var $timer  = null;//计时器
    //删除定时器
    function clearTimer(){
        clearInterval($timer);
        $timer = null;
    }

    function setTimer(_type,_done){
        clearTimer();
        timerType = _type;
        let _t =  $allTime[_type];
        updateState({"time":_t ,"timer" :_type });

        $timer = setInterval(function() {
            if($state$["pause"] == true){return};
            _t--;
            updateState({"time":_t ,"timer" :_type })
            if(_t<1){
                clearTimer()
                _done();
            }
        },990);
    }
    /**************** 定时器*******************/


    function updateBanks(){
        co(function *(){
            let grouplist = yield models.group.findAll({where:{type:"quest" }, 'attributes':['name','flag'] ,'order':'createdAt DESC',});
            let list = [];
            for(let i =0; i<grouplist.length;i++){
                list.push(grouplist[i]["dataValues"])
            }
            $state$["banks"] = list;
        })
    }


    function resetGame(){
        clearTimer();
        $state$ = {};
        $state$ ["pause"] = false;
        $state$ ["index"] = true;
        $state$["sence"] ="waiting";//场景  loading(页面加载,页面起始状态), waiting（等候开始，服务起始状态）, comming（即将开始），gaming（进行中），gameover（排行榜，游戏结束），

        //时间控制
        $state$["time"] =0;//倒计时时间（不区分是什么倒计时）
        $state$["timer"] = ""; // 计时器类型

        //题目
        $state$["mode"] ="";//游戏模式  J: 竞答，Q:抢答
        $state$["vied"]  = false; //是否开抢
        $state$["bank"] ="";//已选择题库分组gflag
        $state$["banks"] =[];//题库列表

        updateBanks();
        $state$["curQindex"] =0; //题目序号
        $state$["curQuest"] ={};//题目内容


        //用户
        $state$["users"] =[];//用户列表  key  = sid
        $state$["first"] ="";//第一个抢到的用户

        $users$ = $users$||{};
        for(var i in $users$){
            if($users$[i]["type"] == "player") {
                $users$[i]["score"] = 0;
                $state$["users"].push($users$[i])
            }
        }


         $curQuest = null;//当前题目带答案

         //$vied = false;  //抢答是否开始()
         $questIdArr=[]; //问题ID数组,选择题库后读取数据库


    }

    resetGame();


    //更新试题ID列表
    function updateQuest(questType){
        if(questType){
            $state$.bank =questType;
            co(function *(){
                let where ={};
                if (questType  !=  "random"){
                    where["gflag"] = questType;
                }
                let grouplist = yield models.question.findAll({"where":where, 'attributes':['id']});
                $questIdArr = [];
                for(let i =0; i<grouplist.length;i++){
                    $questIdArr.push(grouplist[i]["dataValues"]["id"])
                }
                console.log(questType)
                if (questType  ==  "random"){
                    $questIdArr = _.sampleSize($questIdArr,25)
                }


            })
        }
    }




    //下一题
    function nextQuest(){
        $state$["vied"] = false;

        let qindex =  parseInt($state$["curQindex"]) ;
        console.log(qindex +"===="+ $questIdArr.length)
        if (qindex== $questIdArr.length ){
            updateState({"sence":"gameover","curQuest":{},"curQindex":0});
            return;
        }

        let qid = $questIdArr[qindex];
        console.log(qid)
        co(function *(){
            var quest =yield models.question.findOne({where:{id:qid}});
            quest = quest["dataValues"];
            if(quest){
                console.log(quest);
                quest["option"] = JSON.parse(quest["option"]);
                quest["image"] = quest["image"];
                quest["video"] = quest["video"];
                quest["audio"] = quest["audio"];

                quest["muilte"] = quest["answer"].length > 1 ? true : false;

                $curQuest = _.cloneDeep(quest);

                delete quest["answer"];
                if( $state$["mode"] =="Q"){
                    delete quest["option"];
                    setTimer("vying",function(){
                        updateState({"vied":true});
                    });
                }
                if( $state$["mode"]  =="J"){
                    setTimer("answering",function(){
                        sendToAll("submitAnswer");
                        updateState({"curQuest":$curQuest});
                        setTimer("showing",function(){
                            nextQuest();
                        })
                    });
                };
                updateState({"first":" ", "curQindex":++qindex, "curQuest":quest});
            }else{
                nextQuest();
                console.log("答题期间请勿修改题库");
                socket.emit("err",{type:"server",msg:"答题期间请勿修改题库。"})
            }
        });
    }

    function restartGame(){
        resetGame();
        setTimeout(function(){
            sendToAll("updateState",$state$)
        },100)
    }


    //更新状态,无参数时更新所有参数 todo 检查参数
    function updateState(state){
        for(var key in  state){
            //更具状态处理部分
            switch (key){
                case "bank":updateQuest(state["bank"]);break;
                case "sence": {
                    let _sence = state["sence"];
                    switch (_sence){
                        case "waiting":restartGame();break;
                        case "comming":setTimer("comming",function(){
                            updateState({"sence":"gaming"});
                            nextQuest()
                        });break;
                    }
                };break;
            }
            $state$[key] =state[key] ;
        };
        sendToAll("updateState",state)
    }

    //请求处理
    function onConnection(client){

         //用户信息
         let user = {
                "sid":"",//session ID
                "avatar":"",//头像路径
                "name":"",//昵称
                "type":"player",//类型 默认player  分屏：screen  控制端：admin
                "score":0,//分数
                "online":true,//是否在线
                "quit":false//是否退出游戏
        };


        //给自己发信息
        function sendToSelf(_type,_msg){
            if(client){
                //console.log("To Self ["+_type+"]:"+JSON.stringify(_msg));
                client.emit(_type,_msg);
            }
        }

        //管理员权限检查
        function checkAdmin(){
            if(user.type=="admin"){
                return true;
            }else {
                sendToSelf("noauth",{msg:"权限设置"});
                return false
            }
        }

        //登录检查
        function checkLogin(){
            if(user.type){return true;}else {sendToSelf("noauth",{msg:"请刷新页面重新进入游戏"});return false}
        }

        function getSid(){
            let cookieString = client.handshake.headers.cookie;
            if(/sid=([^;]+?)(;|$)/.test(cookieString) == false ){
                return "";
            }
            let cookieID = RegExp.$1;
            return cookieID
        }

        //更新个人信息
        function upUserState(state){
            let sid = user["sid"];
            if(!sid){
                sendToSelf("noauth");
            }

            for(var key in state){
                user[key] = state[key];
                if( typeof $users$[sid]  !== "object") {
                    $users$[sid] = user;
                    $state$["users"].push(user);
                }
                $users$[sid][key] = state[key];
                for (var i in $state$["users"]){
                    if ($state$["users"][i]["sid"] === sid){
                        $state$["users"][i][key] = state[key];
                        break;
                    }
                }
            }
            sendToAll("upUserInfo",user);
        }


        //掉线
        client.on('disconnect',function(){
            if(user && user["sid"]){
                upUserState({online :false})
            }
        });

        //退出
        client.on('quite',function(){
            upUserState({online:false, quit:true});
        });


        client.on("updateState",function(state){
            if(checkAdmin()){
                updateState( state)
            }
        });

        // 链接加入
        client.on("join",function(){
        });

        co(function*(){

            let cookieString = client.handshake.headers.cookie;
            if(/sid=([^;]+?)(;|$)/.test(cookieString) == false ){
                sendToSelf("noauth",{"msg":"未登录"});
                return ;
            }


            let cookieID = RegExp.$1;
            var sess = yield session.find("koa:sess:"+cookieID);
            if(!sess ||  !sess.type ){
                sendToSelf("noauth",{"msg":"未登录"});
                return ;
            }

            user.sid = cookieID;
            user.name = sess["name"]||"";
            user.avatar = sess["avatar"]||"";
            user.type = sess["type"];
            user.online = true;
            user.quit = false;


            console.log($users$)
            try{
                if( $users$[cookieID] ){
                    console.log(user["name"]+"重新连接");
                    user["score"] = $users$[cookieID]["score"];
                    sendToSelf('clientInfo',user);
                    sendToSelf("updateState",$state$);
                }else{
                    console.log(user["name"]+ "重新连接");
                    sendToSelf('clientInfo',user);
                    sendToSelf("updateState",$state$);
                    console.log("updateState")
                    client.join(user.type);
                }
            }catch (e){
                console.log(e)
            }

            upUserState(user);
        });
         // palyer 抢
        client.on("vie",function(){
            if($state$["vied"] == true ){
                updateState({"first" :user["sid"] ,"vied": false });
                $state$["vied"]  = false;
                let quest = _.cloneDeep($curQuest);
                delete quest["answer"];
                sendToSelf("updateState",{"curQuest": quest});
                setTimer("answering",function(){
                    sendToSelf("submitAnswer");
                    updateState({"curQuest":$curQuest});
                    setTimer("showing",function(){
                        nextQuest();
                    })
                });
            }
        });
        // 接收答题
        client.on("answer",function(data){
            let ans = generateAnswer(data);
            if($state$.mode =="Q"){
                if(user.sid == $state$["fistUser"] ) {
                    if (ans == $curQuest["answer"]) {
                        user.score += $curQuest.score || 1;
                        sendToSelf("outcome", {right: true, score: user.score});

                    } else {
                        user.score -= $curQuest.score || 1;
                        sendToSelf("outcome", {right: false, score: user.score});
                    }
                }
            }else if($state$.mode =="J"){
                if(ans == $curQuest["answer"]){
                    user.score += $curQuest.score ||  1;
                    sendToSelf("outcome",{right: true,score:user.score});
                }else{
                    sendToSelf("outcome",{right: false,score:user.score});
                }
            }
            upUserState({"score":user.score})
        });
        //重新开始
        client.on('restart',function(){
            resetGame();
            updateState({"sence":"waiting"})
        });
    };//onConnection

    server.on('connection',onConnection);
    server.on('error', function (exc) {
        console.log("ignoring exception: " + exc);
    });
};
