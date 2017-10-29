'use strict';
const api= require("./api");
//const api= {};


const cfg = require('../config.json');

module.exports  ={
    "API":api,
    "index":function * (next){
        this.session = this.session || {};
        this.redirect('/theme/'+(cfg.game.theme.value||"default")+'/index.html');
    },
    "player":function * (next){
        if(this.session["type"] =="player"){
            this.redirect('/theme/'+(cfg.game.theme.value||"default")+'/player.html');
        }else{
            this.session = {};

            this.redirect("/");
        }
    },
    "quest":function *(next){
        if(this.session["type"] =="admin"){
            this.redirect('/theme/'+(cfg.game.theme.value||"default")+'/screen.html');
        }else{
            //本机免登陆
            if(this.ip == this.hostname){
                this.session ={};
                this.session["type"] ="admin";
                this.session["name"] ="管理员";
                this.redirect('/theme/'+(cfg.game.theme.value||"default")+'/screen.html');
            }else{
                this.session = {};
                this.redirect("/");
            }
        }
    },
    "screen":function *(next){
        this.session = {};
        this.session["type"] ="screen";
        this.session["name"] ="大屏幕";
        this.redirect('/theme/'+(cfg.game.theme.value||"default")+'/screen.html');
    },
    //管理员
    "manager":function*(next){
        if(this.ip == this.hostname){
            this.session ={};
            this.session["type"] ="admin";
            this.session["name"] ="管理员";
        }
        if(this.session["type"] =="admin"){
            this.redirect('/theme/'+(cfg.game.theme.value||"default")+'/manager.html');
        }else{
            this.session = {};
            this.redirect("/");
        }
    }
};