"use strict";
const co = require('co');
const session = require('koa-generic-session');
const SessionMode =  require('./models').session;
const FORTY_FIVE_MINUTES = 24*60 * 60 * 1000 ;

let getExpiresOn = function(session, ttl){
    let expiresOn = null ;
    ttl = ttl || FORTY_FIVE_MINUTES;
    if(session && session.cookie && session.cookie.expires) {
        if (session.cookie.expires instanceof Date) {
            expiresOn = session.cookie.expires
        } else {
            expiresOn = new Date(session.cookie.expires)
        }
    } else {
        let now = new Date() ;
        expiresOn = new Date(now.getTime() + ttl) ;
    }
    return expiresOn
};

var Store = function () {
    let cleanup = function() {
        let where = {"where":{
            "expires":{$lt: new Date().getTime() }
        }};
        co(function*() {
            yield SessionMode.destroy(where);
        });
    };
    setInterval( cleanup, 30 * 60 * 1000 );
};


function *find (sid){
    let where = {"where":{"id":sid}};
    let qdata = yield SessionMode.findOne(where);
    let session = null ;
    if (qdata &&  qdata["dataValues"])
    {
        let results =qdata["dataValues"];
        if(results && results["data"]){
            session = JSON.parse( results["data"]);
        }
    }
    return session
}

Store.prototype.get =find;
Store.find =find;

Store.prototype.set = function *(sid, session, ttl) {
    let expires = getExpiresOn(session, ttl).valueOf();
    let data = JSON.stringify(session);
    let results = yield SessionMode.findOne({"where":{"id":sid}});
    if (results){
        yield SessionMode.update({"expires":expires,"data":data},{"where":{"id":sid}});
    }else{
        yield SessionMode.create({"id":sid,"expires":expires,"data":data});
    }
    return 1;
};
Store.prototype.destroy = function *(sid) {
    let where = {"where":{"expires":{"id": sid }}};
    yield SessionMode.destroy(where);

};

module.exports  = Store;
