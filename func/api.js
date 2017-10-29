'use strict';
const uid = require('uid');
const crypto = require('crypto');
const models=require('./models');
const cofs = require('co-fs');
const fs  = require('fs');
const co  = require('co');
const formidable = require('koa-formidable');
const cfg = require('../config');

exports.init = function *(next){
    let salt = uid(4);
    let pass = crypto.createHash('md5').update("sykjzsjd"+salt).digest('hex');
    yield models.user.destroy({where:{}});
    yield models.session.destroy({where:{}});
     //yield models.group.destroy({where:{}});
    //  yield models.group.create({type:"quest","name":"回收站" ,"flag":"dustbin" });
    // yield models.group.create({type:"quest","name":"默认分组" ,"flag":"default" });
    //yield models.group.create({type:"quest","name":"随机分组" ,"flag":"radom" });
    yield models.user.create({username:"admin",nickname:"管理员",password:pass,salt:salt,type:"questioner"});
    this.body ="初始化成功";
};

//加入游戏，上传头像
exports.join = function *(next){
    try {
        this.session = this.session || {};
        let avatar = this.request.body["avatar"];
        let nick = this.request.body["nick"] || "玩家"+uid(4);

        if(/^data:image/.test(avatar)){
            let filename = uid(20)+".png";
            let savePath = __dirname+"/../public/avatar/"+filename;
            let publicPath = "/avatar/"+filename;

            let imgHash = avatar;
            imgHash = imgHash.replace(/\s/g,"+");
            var base64Data = imgHash.replace(/^data:image\/\w+;base64,/, "");
            var dataBuffer = new Buffer(base64Data, 'base64');
            yield cofs.writeFile(savePath,dataBuffer );
            this.session["avatar"] = publicPath;
        }else{
            this.session["avatar"] = avatar || "/theme/default/avatar/2.png";
        }
        this.session["name"] = nick;
        this.session["type"] = "player";
        return this.body = {"code": 0,"msg":"保存文件成功."}
    }catch (err){
        return this.body = {"code": -1,"msg":"上传头像失败，请检查图片格式。"};
    }
};


// 管理员登录
exports.login = function * (next){
    try{
        let uname = this.request.body["user"];
        let upass = this.request.body["pass"];
        if(uname && upass){
            let user = yield models.user.findOne({"where":{"username" :uname}}) ;
            if(user){
                var passHash =crypto.createHash('md5').update(upass+user["salt"]).digest('hex');
                if(user["password"] == passHash){
                    this.session ={};
                    this.session["type"] ="admin";
                    this.session["name"] = user["nickname"];
                    return this.body = {"code": 0,"msg":"登录成功."}
                }else{
                    return this.body = {"code": 1011,"msg":"用户名或密码错误."}
                }
            }else{
                return this.body = {"code": 1011,"msg":"用户名或密码错误."}
            }
        }else{
            return this.body = {"code": 1012,"msg":"缺少参数."}
        }
    }catch (err){
        console.log(err);
        return this.body = {"code": -1,"msg":"服务器异常."};
    }
};

function getIPAdress(){
    var interfaces = require('os').networkInterfaces();
    for(var devName in interfaces){
        var iface = interfaces[devName];
        for(var i=0;i<iface.length;i++){
            var alias = iface[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
}

let localip = getIPAdress();
let hostAdd = "http://"+( localip.length>0?localip:cfg.host.server.value)+":"+ (cfg.host.port.value || "8080");
exports.loadinfo = function(ip,port){
    localip = ip || localip ;
    hostAdd = "http://"+localip+":"+port+"/";
    console.log(hostAdd)
}


//大屏幕
exports.screen={
    "info":function*(next){
        try{
            let wifi_name= cfg.host.wifi.value||"zsjdwifi";
            let reJson = {
                "code":0,
                "msg":"查询成功",
                "wifiName":wifi_name,
                "hostURL":hostAdd
            };
            return this.body=reJson;
        }catch(err){
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    }
};


//分组管理
exports.group = {
    "info":function *(next){
        try{
            let gflag =  this.params["gflag"];
            console.log(gflag);
            let group=yield models.group.findOne({where:{type:"quest" ,"flag":gflag }});
            if(group){
                return this.body = {"code": 0 ,"msg":"查询成功.",info:group}
            } else{
                return this.body = {"code": 1023,"msg":"参数错误,未找到数据."}
            }
        }catch (err){
            console.log(err);
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    list:function*(next){
        try{
            let grouplist = yield models.group.findAll({where:{type:"quest" }, 'attributes':['id','type','name','flag'] ,'order':'createdAt DESC',});
            let list = [];
            for(let i =0; i<grouplist.length;i++){
                list.push(grouplist[i]["dataValues"])
            }
            return this.body = {"code": 0,"msg":"查询成功.",list:list};
        }catch (err){
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    add: function *(next){
        let gname =  this.request.body["name"];
        if(gname){
            let oldgroup=yield models.group.findOne({where:{type:"quest" ,"name":gname }});
            if(oldgroup){
                return this.body = {"code": 1021,"msg":"分组已存在."}
            }
            let flag = uid(8);
            let newgroup = yield models.group.create({type:"quest","name":gname ,"flag":flag });
            return this.body = {"code": 0,"msg":"分组添加成功.",info:newgroup};
        }else{
            return this.body = {"code": 1020,"msg":"缺少参数."};
        }
    },
    update:function *(next){
        try{
            let gid =  this.request.body["id"];
            let gname =  this.request.body["name"];
            let oldgroup=yield models.group.findOne({where:{id:gid,type:"quest"}});
            if(oldgroup){
                oldgroup.update({"name":gname});
                return this.body = {"code": 0,"msg":"分组名称已更新.",info:oldgroup}
            } else{
                return this.body = {"code": 1023,"msg":"分组不存在."}
            }
        }catch  (err){
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    "remove":function *(next){
        try{
            let gid = this.request.body["id"];
            let gflag = this.request.body["flag"];
            if(gflag =="default" || gflag =="dustbin" ){
                return  this.body = {"code": 1026,"msg":"系统分组不可删除."};
            }
            let oldgroup=yield models.group.findOne({where:{type:"quest" ,"id":gid}});
            if(oldgroup){
                yield models.question.update({gflag:"dustbin"},{where:{ gflag :oldgroup["flag"] }});
                yield oldgroup.destroy();
                return this.body = {"code": 0,"msg":"分组已删除，该分组内试题被移动到默认分组."}
            } else{
                return this.body = {"code": 1023,"msg":"参数错误或分组不存在"}
            }
        }catch  (err){
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    }
};

//试题管理
exports.quest={
    "info":function *(next){
        try{
            let qid =  this.params["qid"];
            let question=yield models.question.findOne({where:{id:qid }});
            if(question){
                return this.body = {"code": 0 ,"msg":"查询成功.",info:question}
            } else{
                return this.body = {"code": 1023,"msg":"参数错误,未找到数据."}
            }
        }catch (err){
            console.log(err);
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    "list":function*(next){
        try{
            let size = parseInt(this.query["size"])||10 ;
            let page = parseInt(this.query["page"])||1 ;
            let gflag =  this.query["gflag"]||"default" ;
            let where = {"gflag":gflag};

            let total = yield models.question.count({'where':where});
            let list = yield models.question.findAll({
                'where':where, 'limit': size, 'offset': size * (page - 1)
            });
            let rows = [];
            for(let i =0; i<list.length;i++){
                rows.push(list[i]["dataValues"])
            }
            return this.body = {"code": 0,"msg":"查询成功.",total:total ,list:rows};
        }catch (err){
            console.log(err);
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    "add":function*(next){
        try{
            let title =  this.request.body["title"]||"";
            let option = this.request.body["option"]||"";
            let answer = this.request.body["answer"]||"";
            let gflag = this.request.body["gflag"]||"";
            let scoure = parseInt(this.request.body["scoure"])||1;

            let image = this.request.body["image"]||"";
            let video  = this.request.body["video"]||"";
            let audio  = this.request.body["audio"]||"";

            let question = {title,option,answer,image,video,audio,gflag,scoure};
            let newquest = yield models.question.create(question);
            return this.body = {"code": 0,"msg":"题目添加成功.",info:newquest};
        }catch (err){
            console.log(err);
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    "update":function*(next){
        try {
            let qid = this.request.body["id"];
            let title =  this.request.body["title"];
            let option = this.request.body["option"];
            let answer = this.request.body["answer"];
            let gflag = this.request.body["gflag"];
            let image = this.request.body["image"];
            let video  = this.request.body["video"];
            let audio  = this.request.body["audio"];

            let scoure = parseInt(this.request.body["scoure"])||"1";
            let question = {title,option,answer,image,video,audio,gflag,scoure};
            let oldquestion=yield models.question.findOne({where:{id:qid }});
            if(oldquestion){
                var newquestion =   yield oldquestion.update(question);
                return this.body = {"code": 0,"msg":"更新成功.",info:newquestion.get({'plain': true})}
            } else{
                return this.body = {"code": 1023,"msg":"试题不存在，请检查参数."}
            }
        }catch (err){
            console.log(err);
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    "remove":function*(next){
        try{
            let qid = this.request.body["id"];
            let question=yield models.question.findOne({where:{"id":qid }});
            if(question){
                yield question.destroy();
                return this.body = {"code": 0,"msg":"试题已删除."}
            } else{
                return this.body = {"code": 1023,"msg":"试题不存在."}
            }
        }catch  (err){
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    },
    "upload":function*(next){
        try{
            let upconf= {uploadDir: __dirname+'/../public/upload/',encoding:'utf-8',keepExtensions : true};
            let form = yield formidable.parse(upconf,this);
            let type = this.query["type"] || form["fields"]["type"] ||"";

            if(form["files"]&& form["files"]["file"] && /^(image|audio|video)$/.test(type)){
                let filepath  = form["files"]["file"].path;
                let filename = form["files"]["file"].name;
                /\.([\w\W]*)$/.test(filename);
                let name = uid(20)+"."+RegExp.$1;
                let saveFile =__dirname+ "/../public/"+type+"/"+name;

                fs.renameSync(filepath,saveFile)
                // let readable = fs.createReadStream( filepath );
                // let writable = fs.createWriteStream(  );
                // readable.pipe( writable );

                //同步写文件
                let publicFile = "/"+type+"/"+name;
                return this.body = {"code": 0,"msg":"文件上传成功.",path:publicFile}
            }else{
                return this.body = {"code": 1023,"msg":"参数错误."};
            }
        }catch  (err){
            console.log(err);
            return this.body = {"code": -1,"msg":"服务器异常."};
        }
    }
};



co(function*(){yield  exports.init();});