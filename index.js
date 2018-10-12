var Connection = require('connection');
var HTTPserver = require('./client.js');
var Game = require('./game.js')
//GlobalDefine
var WS_PORT = 4000;

var Client = { state:'connect', client:'', room:''};
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
//サーバーからのリクエストのレスポンス
/*
	sresConnect(self,id,data){
		//管理者権限
		self.clients[id].state = 'superuser';
	}
	sresMakeRoom(self,id,data){
		var room = data.room;
		//新規部屋作成
		self.rooms[room] = new Game();
		console.log('[ sreq  ] make room :' + room);
	}
*/
//---------------------------------------------------------------------
//response
//クライアントからのメッセージを処理する
	resConnect(self,id,data){
		var name = data.name;
		var room = data.room;

		if(room === undefined || room == ''){
			//不正アクセス(部屋名なし)制限
			return;
		}
		if(!self.rooms[room]){
			self.makeRoom(room);
		}
		self.clients[id].state = 'entry';
		self.rooms[room].playerEntry(id);
		console.log('[ client ] entry named :' + name);
	}
	makeRoom(room){
		//新規部屋作成
		this.rooms[room] = new Game();
		console.log('[ sreq  ] make room :' + room);
	}
//---------------------------------------------------------------------
//request
//サーバーから呼びかける
	/*
	reqRollCall(){
		//closeでまかなえなかった場合に作成する
		this.broadcastRollCall();
	}*/
//---------------------------------------------------------------------
//send
	sendConnectionCallback(id,client){
		var send = {};
		send.type = 'connect';
		send.data = {};
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
}

var gs = new GameServer({server: HTTPserver(WS_PORT)});