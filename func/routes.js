
'use strict';
const  koaBody = require('koa-body')();
const controle = require('./controle');
module.exports = function(app){
    app.route('/').all(controle.index);
    app.route('/questioner').all(controle.quest);
    app.route('/player').all(controle.player);
    app.route('/screen').all(controle.screen);
    app.route('/manager').all(controle.manager);
     app.route('/api/').all(controle.API.init);
     app.route('/api/join').all(koaBody,controle.API.join);
     app.route('/api/login').all(koaBody,controle.API.login);
     app.route('/api/group').all(koaBody,controle.API.group.list);
     app.route('/api/group/add').all(koaBody,controle.API.group.add);
     app.route('/api/group/update').all(koaBody,controle.API.group.update);
     app.route('/api/group/remove').all(koaBody,controle.API.group.remove);
     app.route('/api/group/:gflag').all(koaBody,controle.API.group.info);
     app.route('/api/quest').all(koaBody,controle.API.quest.list);
     app.route('/api/quest/add').all(koaBody,controle.API.quest.add);
     app.route('/api/quest/update').all(koaBody,controle.API.quest.update);
     app.route('/api/quest/upload').all(koaBody,controle.API.quest.upload);
     app.route('/api/quest/remove').all(koaBody,controle.API.quest.remove);
     app.route('/api/quest/:qid').all(koaBody,controle.API.quest.info);
     app.route('/api/screen/info').all(koaBody,controle.API.screen.info);
     app.route('/*').all(controle.index);
}
