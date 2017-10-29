/*
*启动器
*负责启动服务器程序
*/
"use strict"
const os  =  require('os');
const net = require('net');
var server = require("./server.js");

function GetCurrentIPS(){
    let ips = [];
    var interfaces = os.networkInterfaces();
    for(var devName in interfaces){
        var ifacese = interfaces[devName];
        ifacese.forEach(function(alias){
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                if(!(/\.1$/.test(alias.address))){
                    ips.unshift(alias.address);
                }else{
                    ips.push(alias.address);
                }
            }
        })
    }
    return ips
}

//监听网卡
var ipArr = [];
function InterFaceMonitor(interval,onchange){
    let timer = null;
    timer = setInterval(function(){
        let ips = GetCurrentIPS();
        ips.forEach(function(ip){
            if(ipArr.indexOf(ip)==-1){
                onchange("add",ip);
                ipArr.push(ip);
            }
        })
        ipArr.forEach(function(ip){
            if(ips.indexOf(ip)==-1){
                onchange("drop",ip)
                ipArr.pop("ip")
            }
        })
    },interval)
}


function onChange(type,ip){
    console.log("IP add changed")
    console.log(type+":"+ip);

    server.close();

}
InterFaceMonitor(2000,onChange);

function getEmptyPort(sPort,callback){
    function portCheck(port){
        let server = net.createServer().listen(port)
        server.on('listening', function () { 
            console.log("port check success")
            server.close()
            callback(port);
        })
        server.on('error', function (err) {
            console.log("Port check error")
            if (err.code === 'EADDRINUSE') { 
                port+=1;
                portCheck(port)
            }else{
                console.log("Port check error")
            }
        })
    }
    portCheck(sPort)
}

ipArr = GetCurrentIPS();
console.log(ipArr);

function initServer(port){
    if(ipArr.length>0){
        server.start(ipArr[0],port)
    }
};

getEmptyPort(3000,initServer);