var Connection = require('connection');
var HTTPserver = require('./client.js');
var Game = require('./game.js')
//GlobalDefine
var WS_PORT = 4000;

var Client = { state:'connect', client:'', room:''};
var RecieveConnect ={ name:'' ,room:'' };
var RecieveInput  = { id:'', type:'input', strong:0, angle:0 ,frame:0};
var SendConnect   = { type: 'connect', data: {id:'' } };
var SendGameReady = { type: 'ready', data: { member:[] } };
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

		console.log('[ client ] connected id:' + id);
		console.log('[ client ] length :' + Object.keys(this.clients).length);

		//super.broadcast(id);
	}
	onMessage(id,client,message){
		var obj = JSON.parse(message);
		if(this.response[obj.type]){
			this.response[obj.type](this,id,obj.data);
		}
		console.log('[ client ] message from id:' + id + ' : ' + message);
	}
	onClose(id,client,address){
		this.clients[id].room;
		delete this.clients[id];
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
			input: this.resInput,
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
		self.clients[id].room = obj.room;
		self.rooms[obj.room].playerEntry(id);
		if(self.rooms[obj.room].isPlayerMax()){
			self.reqGameReady(obj.room);
			//if(self.isUpdateStart()){
			//	self.startUpdate();
			//}
		}

		console.log('[ client ] entry named :' + obj.name);
	}
	resInput(self,id,data){
		var room = self.clients[id].room;
		var type = data.type;
		var str = data.strong;
		var ang = data.angle;
		if(self.rooms[room]){
			self.rooms[room].input(id,type,str,ang);
		}
		console.log('[ client ] input :' + id);
	}
//---------------------------------------------------------------------
//request
//サーバーから呼びかける
	reqGameReady(room){
		var obj = Object.create(SendGameReady);
		obj.type = 'ready';
		obj.data = {};
		obj.data.member = [];
				//obj.data = {};
		for(var id in this.clients){
			if(this.clients[id].room == room){
				obj.data.member.push(id);
			}
		}
		for(var id in this.clients){
			if(this.clients[id].room == room){
				super.send(this.clients[id].client,JSON.stringify(obj));
				console.log("Ready " + id);
			}
		}
		var my = this;
		setTimeout(function(){my.reqGameStart(room)},2000);
		
	}
	reqGameStart(room){
		var obj = Object.create(SendGameStart);
		obj.type = 'start';
		obj.data = {};
		for(var id in this.clients){
			if(this.clients[id].room == room){
				super.send(this.clients[id].client,JSON.stringify(obj));
			}
		}
		this.rooms[room].startGame();
		console.log("Start");
		var my = this;
		setTimeout(function(){my.deleteRoom(room)},20000);
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
		send.data = {};
		send.data.id = id;
		super.send(client,JSON.stringify(send));
	}
	sendMessage(id,msg){
		super.send(this.clients[id].client,msg);
	}
//---------------------------------------------------------------------
//updateTrigger (bool)
	isUpdateStart(){
		var isStart = Object.keys(this.rooms).length >= 1;
		return isStart;
	}
	isUpdateStop(){
		var isStop = Object.keys(this.rooms).length < 1;

		return isStop;
	}
//---------------------------------------------------------------------
//update
/*
	updateGame(){
		//var sample = "";
		for(var id in this.rooms){
			if(this.rooms[id].update()){
				this.reqGameStart(id);
				this.rooms[id].start = true;
			}
			if(this.rooms[id].checkFinish()){
				delete this.rooms[id];
				if(this.isUpdateStop()){
					this.stopUpdate();
				}
			}
		//	sample = id;
		}
		//console.log("[ game  ] update game :" + this.rooms[sample].frame);//Object.keys(this.rooms).length);
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
		//self.updateGame();
		
	}*/
//---------------------------------------------------------------------
//utility
	makeRoom(room){
		//新規部屋作成
		this.rooms[room] = new Game(this);
		console.log('[ sreq  ] make room :' + room);
	}
	deleteRoom(room){
		this.rooms[room].closeGame();
		delete this.rooms[room];
	}
}

var gs = new GameServer({server: HTTPserver(WS_PORT)});
