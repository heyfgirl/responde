'use strict';
const Sequelize = require(__dirname+'/sequelize/index');
const path = require('path')
//const Sequelize = require('sequelize');
const sequelize = new Sequelize("responder", null,null,
    {
        dialect:"sqlitejs",
        storage:__dirname+"/../data/db.sqlite",
        logging: false
    }
);
sequelize.authenticate();
sequelize.sync({
    //force:true
});
var user = sequelize.define('user',{
    username: {
        type: Sequelize.STRING,
        allowNull: false,
        autoIncrement: false,
        unique: true,
        primaryKey: false
    },
    nickname: {
        type: Sequelize.STRING,
        allowNull: false,
        autoIncrement: false,
        unique: true,
        primaryKey: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    salt: {
        type: Sequelize.STRING,
        validate: {
            isAlphanumeric: true,
            len:4
        },
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    type: {
        type: Sequelize.ENUM('USER','ADMIN'),
        allowNull: true,
        autoIncrement: false,
        primaryKey: false,
        defaultValue: "WHITE"
    }
});



var session = sequelize.define('session',{
        id:{
            type: Sequelize.CHAR,
            allowNull: false,
            autoIncrement: false,
            primaryKey: true,
            unique: true
        },
        expires:{
            type: Sequelize.BIGINT,
            allowNull: false,
            autoIncrement: false,
            primaryKey: true
        },
        data:{
            type: Sequelize.TEXT,
            allowNull: false,
            autoIncrement: false,
            primaryKey: false
        }
    },{
        createdAt:false,
        updatedAt:false
    }
);

var group = sequelize.define('group', {
    type:{
        type: Sequelize.STRING(24),
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    flag: {
        type: Sequelize.STRING(8),
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    name:{
        type: Sequelize.STRING(24),
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    extend:{
        type: Sequelize.STRING,
        allowNull: false,
        autoIncrement: false,
        primaryKey: false,
        defaultValue: '{}'
    }
});

var question = sequelize.define('question',{
    title:{
        type: Sequelize.STRING,
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    image:{
        type: Sequelize.STRING,
        autoIncrement: false,
        primaryKey: false
    },
    video:{
        type: Sequelize.STRING,
        autoIncrement: false,
        primaryKey: false
    },
    audio:{
        type: Sequelize.STRING,
        autoIncrement: false,
        primaryKey: false
    },
    option:{
        type: Sequelize.TEXT,
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    answer:{
        type: Sequelize.CHAR(24),
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    scoure:{
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    },
    gflag:{
        type: Sequelize.STRING(8),
        allowNull: false,
        autoIncrement: false,
        primaryKey: false
    }
});


//user.sync({force: true });
//session.sync({force: true });
//question.sync({force: true });
//group.sync({force: true });

function getSequelize(){
    return sequelize
}

module.exports ={session,user,group,question,getSequelize};
