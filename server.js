const Router = require('koa-routing');
const koa_session = require('koa-generic-session');
const koa = require('koa');
const session = require('./func/session');
const co = require('co');
const cfg = require('./config.json');
const Api = require('./func/api');
const routes = require('./func/routes');
const Gamer = require('./func/game');
var app=null;
var server = null;

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

if(module.parent){
    exports.start = (ip,port)=>{
        if(app){app = null};
        app = koa();
        server = require('http').createServer(app.callback());
        Gamer.start(server)
        app.use(require('koa-static')( __dirname+'/public'));
        app.use(koa_session({ 'store': new session(), 'cookie': {'signed': false,'httpOnly': false}, 'key':'sid'}));
        //app.use(require('koa-views')( __dirname+'/public/theme/'+(cfg.game.theme.value||"default"), {'extension': { 'html': 'underscore', 'jade':'jade'}}));
        app.use(Router(app));
        routes(app);
        server.listen(port || "8080","0.0.0.0");
        Api.loadinfo(ip,port)


    };
    exports.close = ()=>{
        try{
            if(server){
                Gamer.close();
                server.close();
                app=null;
                server =null;
            }
        }catch(e){
            console.log(e)
        }
    }
}else{

    if(app){app = null};
    app = koa();
    server = require('http').createServer(app.callback());
    app.use(function *(next){
        yield  next;
        if(this.status == 302){
            console.log( this.path +"===================="+this.status);
        }
    });
    Gamer.start(server)
    app.use(require('koa-static')( __dirname+'/public'));
    app.use(koa_session({ 'store': new session(), 'cookie': {'signed': false,'httpOnly': false}, 'key':'sid'}));
    app.use(Router(app));
    routes(app);
    console.log("This is main tread,listen to 8080!!!")
    server.listen("8080","0.0.0.0");
    var  ip  = getIPAdress();
    Api.loadinfo(ip,"8080")
};
