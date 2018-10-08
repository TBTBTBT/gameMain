var Connection = require('connection');
var HTTPserver = require('./client.js');
//GlobalDefine
var WS_PORT = 3000;


class ClientFormat{
	constructor(client,state){
		this.client = client;
		this._state = '';		
		this.room = '';
	}

	set state(val) {
    	console.log('[ client ]state=' + val);
    	this._state = val;
  	}
  	get state(){
  		return this._state
  	}
}
class ResponseFormat{
	constructor(){
		this.response ={

		};
	}
}
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
class MatchingServer extends Connection{
//---------------------------------------------------------------------
//マッチングロジック
	matchingLogic(clients){
		var group = [];
		var num = 2;
		group.push([]);
		for (var id in clients){
			if(clients[id].state == 'wait'){
				if(group[group.length - 1].length < num){
						group[group.length - 1].push(id);
				}
				else{
					group.push([id]);
				}

			}
		}
		
		for (var i = 0 ; i < group.length; i ++){
			if(group[i].length == num){
			var roomId = group[i][0];
				for (var j = 0 ; j < group[i].length; j ++){
					clients[group[i][j]].state = 'match';
					clients[group[i][j]].room  = roomId;
				}
			}
		}




		//console.log(group);
		console.log("[ update ] group make " + group.length);
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
//response
	resConnect(self,id,data){
		var name = data.name;

		console.log('[ client ] entry named :' + name);
		self.clients[id].state = 'entry';
	}
	resEntry(self,id,data){
		
		self.clients[id].state = 'entry';
	}
//---------------------------------------------------------------------
//constructor
	constructor(data){
		super(data);
		this.clients = {};
		this.responseDefine();
		//this.startUpdate();
	}


//---------------------------------------------------------------------
//request

	/*
	reqRollCall(){
		//closeでまかなえなかった場合に作成する
		this.broadcastRollCall();
	}*/
	
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
//---------------------------------------------------------------------
//send
	sendConnectionCallback(id,client){
		var send = {};
		send.type = 'connect';
		send.data = {};
		send.data.id = id;
		super.send(client,JSON.stringify(send));
	}
	sendMatchingInfo(id,client){
		var send = {};
		send.type = 'match';
		send.data = {};
		send.data.address = "ws://";
		send.data.room = this.clients[id].room;
		super.send(client,JSON.stringify(send));
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

var ms = new MatchingServer({server: HTTPserver(WS_PORT)});