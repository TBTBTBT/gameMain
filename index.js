var Connection = require('connection');
var HTTPserver = require('./client.js');
var Game = require('./game.js')
//GlobalDefine
var WS_PORT = 4000;

var Client = { state:'connect', client:'', room:''};
var RecieveConnect ={ name:'' ,room:'' };
var SendConnect   = { type: 'connect', data: {id:'' } };
var SendGameReady = { type: 'ready', data: { member:[], waitsec:5 } };
var SendGameStart = { type: 'start', data: {} };
//---------------------------------------------------------------------
//GameServer
//マッチングサーバーからのリクエストで起動
class GameServer extends Connection{
//---------------------------------------------------------------------
//constructor
	constructor(data){
		super(data);
		this.clients = {};
		this.rooms= {};
		this.responseDefine();
		//this.startUpdate();
	}

//---------------------------------------------------------------------
//callback
	onOpen(id,client,req){
		this.clients[id] = Object.create(Client);
		this.clients[id].client = client;
		this.sendConnectionCallback(id,client);
		if(this.isUpdateStart()){
			this.startUpdate();
		}
		console.log('[ client ] connected id:' + id);
		console.log('[ client ] length :' + Object.keys(this.clients).length);

		//super.broadcast(id);
	}
	onMessage(id,client,message){
		var obj = JSON.parse(message);
		this.response[obj.type](this,id,obj.data);
		console.log('[ client ] message from id:' + id + ' : ' + message);
	}
	onClose(id,client,address){
		delete this.clients[id];
		if(this.isUpdateStop()){
			this.stopUpdate();
		}
		console.log('[ client ] disconnected id:' + id);
		
	}
	onError(e){
		console.log(e);
		
	}

	//omit
	/*
	broadcastRollCall(){

		var send = {};
		send.type = 'rollcall';
		send.data = {};
		send.data.id = id;
	}*/

//---------------------------------------------------------------------
//responseDefine
//クライアントからのmessageのtypeに対するレスポンス定義
	responseDefine(){
		this.response = {
			connect: this.resConnect,
		}
	}
//---------------------------------------------------------------------
//response for request from server
//サーバー間通信
//---------------------------------------------------------------------
//response
//クライアントからのメッセージを処理する
	resConnect(self,id,data){
		var obj = Object.create(RecieveConnect);
		obj.name = data.name;
		obj.room = data.room;

		if(obj.room === undefined || obj.room == ''){
			//不正アクセス(部屋名なし)制限
			return;
		}
		if(!self.rooms[obj.room]){
			self.makeRoom(obj.room);
		}
		self.clients[id].state = 'entry';
		self.rooms[obj.room].playerEntry(id);
		if(self.rooms[obj.room].isPlayerMax()){
			self.reqGameReady(obj.room);
		}
		console.log('[ client ] entry named :' + obj.name);
	}

//---------------------------------------------------------------------
//request
//サーバーから呼びかける
	reqGameReady(room){
		var obj = Object.create(SendGameReady);
		for(id in this.clients){
			if(this.clients[id].room == room){
				obj.data.member.push(id);
			}
		}
		for(id in this.clients){
			if(this.clients[id].room == room){
				super.send(this.clients[id].client,JSON.stringify(obj));
			}
		}
	}
	reqGameStart(room){
		var obj = Object.create(SendGameStart);
		for(id in this.clients){
			if(this.clients[id].room == room){
				super.send(this.clients[id].client,JSON.stringify(obj));
			}
		}
	}
	/*
	reqRollCall(){
		//closeでまかなえなかった場合に作成する
		this.broadcastRollCall();
	}*/
//---------------------------------------------------------------------
//send
	sendConnectionCallback(id,client){
		var send = Object.create(SendConnect);
		send.type = 'connect';
		send.data.id = id;
		super.send(client,JSON.stringify(send));
	}
//---------------------------------------------------------------------
//updateTrigger (bool)
	isUpdateStart(){
		var isStart = Object.keys(this.rooms).length > 1;
		return isStart;
	}
	isUpdateStop(){
		var isStop = Object.keys(this.rooms).length <= 1;

		return isStop;
	}
//---------------------------------------------------------------------
//update
	updateGame(){

		console.log("[ game  ] update game :" + Object.keys(this.clients).length);
	}





//---------------------------------------------------------------------
//---------------------------------------------------------------------
	startUpdate(){
		var my = this;
		//console.log(this.timer);
		if(this.timer === undefined){
			this.timer = setInterval(function(){my.update(my);}, 200);
		}
	}
	stopUpdate(){
		//console.log(this.timer);
		clearInterval(this.timer);
		this.timer = undefined;
	}
	update(self){
		self.updateGame();
		
	}
//---------------------------------------------------------------------
//utility
	makeRoom(room){
		//新規部屋作成
		this.rooms[room] = new Game();
		console.log('[ sreq  ] make room :' + room);
	}
}

var gs = new GameServer({server: HTTPserver(WS_PORT)});