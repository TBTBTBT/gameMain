var Connection = require('connection');
var HTTPserver = require('./client.js');
var Game = require('./game.js')
//GlobalDefine
var WS_PORT = 3000;


//---------------------------------------------------------------------
//MatchingServer
//抽象化したい関数を上から順に書く
//matchingLogic マッチングする際のロジック

//クライアントのステートいちらん
//connect 初回接続
//entry   名前等初期情報受信後
//wait    マッチング待ち
//match   マッチング
//exit    マッチング情報送信後
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
//responseDefine
//クライアントからのmessageのtypeに対するレスポンス定義
	responseDefine(){
		this.response = {
			connect: this.resConnect
		}
	}
//---------------------------------------------------------------------
//response for request from server
//サーバーからのリクエストのレスポンス

	sresMakeRoom(room){
		//新規部屋作成
		self.rooms[room] = new Game();
		console.log('[ sreq  ] make room :' + room);
	}

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
			return;
		}
		self.clients[id].state = 'entry';
		self.rooms[room].playerEntry(id);
		console.log('[ client ] entry named :' + name);
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
		var isStart = Object.keys(this.clients).length > 1;
		return isStart;
	}
	isUpdateStop(){
		var isStop = Object.keys(this.clients).length <= 1;

		return isStop;
	}
//---------------------------------------------------------------------
//update
	updateClientState(){

		for (var id in this.clients){
			if(this.clients[id].state == 'entry'){
				this.clients[id].state = 'wait';
			}
		}
		console.log("[ update ] update clients :" + Object.keys(this.clients).length);
	}
	updateMatching(){
		this.matchingLogic(this.clients);
		for (var id in this.clients){
			if(this.clients[id].state == 'match'){
				console.log(" matching :" + id);
				this.sendMatchingInfo(id,this.clients[id].client);
				this.clients[id].state = 'exit';
			}
		}
		console.log("[ update ] update matching :" + Object.keys(this.clients).length);
	}



	
//---------------------------------------------------------------------
//callback
	onOpen(id,client,req){
		this.clients[id] = new ClientFormat(client,'connect');
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
//---------------------------------------------------------------------
	startUpdate(){
		var my = this;
		//console.log(this.timer);
		if(this.timer === undefined){
			this.timer = setInterval(function(){my.update(my);}, 1000);
		}
	}
	stopUpdate(){
		//console.log(this.timer);
		clearInterval(this.timer);
		this.timer = undefined;
	}
	update(self){
		self.updateClientState();
		self.updateMatching();
		
	}
}

var gs = new GameServer({server: HTTPserver(WS_PORT)});