//Pirates Clash
//correct gunner

var ws = require('ws');

var PLAYER_NUM = 2;
var ADD_FRAME = 20;
var TIME_DIVISION = 20;//1フレームの長さ (1000 / x) UNIXタイム計算に必要
var GAME_LENGTH = 100000;//1ゲームの長さ(ミリ秒)
//---------------------------------------------------------------------
//datadefine
var Input 	  = { pid:0, type:'input', strong:0, angle:0 ,frame:0};//input skip
var Player 	  = { id:'', pid:0 ,charge:0};
var SendInput = { type: 'input', data:{ id:'', type:'input', strong:0, angle:0, frame:0, number:0} };

/*いらなくなった
class Player{
	constructor(id){
		this.id = id;
		this.charge = 0;//マナ的な
	}
	recieveInput(message){

	}
	sendInput(){
		var msg = {};
		var data = {};
		data.id = this.id;

		msg.type = 'input';
		msg.data = data;

		return JSON.stringify(obj);
	}

}*/
//受信データ:入力(強さint、角度int) (砲弾先送り)
//送信データ:相手の入力(入力受付フレーム(予告)int,int,int)

//フロー
//1.マッチングサーバーのリクエストで部屋を作られる
//2.プレイヤーの接続を待つ
//3.両方接続確認で開始 そうでなければエラーを返す
//4.0.2secおきにupdateを呼び出し ゲーム計算をおこなう frame数も記録する
//5.入力があった場合、即座に受付フレーム数を計算し、そのフレームの時に代入する また、その結果をbroadcastする。
//!20181022 ゲーム計算を行わない UNIX時間を利用して計算
class GameMain {
	constructor(server){
		this.rule ={};
		this.player = {};
		this.state = 'ready';
		this.log = [];
		this.start = false;
		this.server = server;
		this.setRule();
	}
	setRule(){
		this.rule.time = GAME_LENGTH;
		this.rule.add = ADD_FRAME;
	}
	startGame(){
		this.state = 'start';
		this.time = Date.now();
	}

	broadcast(msg){
		for (var id in this.player){
			if(this.server.clients[id] === undefined){
				continue;
			}
			this.server.sendMessage(id,msg);
		}
	}
	input(id,type,strong,angle){
		if(this.state != 'start'){
			return;
		}
		//if(this.player[id].input !== undefined){
		//	return;
		//}
		//if(type == "bullet" ){
			var obj = Object.create(Input);
			obj.pid = this.player[id].pid;
			obj.strong = strong;
			obj.angle = angle;
			obj.type = type;
			this.processInput(obj);
			//this.player[id].input = obj;
		//}
	}
	processInput(input){
		var send = input;
		var frame = parseInt( ( Date.now() - this.time ) / TIME_DIVISION  );
		var format = {};
		send.frame = frame + ADD_FRAME;
		send.number = this.log.length;
		format.type = 'input';
		format.data = send;
		this.broadcast(JSON.stringify(format));
		//this.cache.push(JSON.stringify(format));
		this.log.push(JSON.stringify(format));
	}

	playerEntry(id){
		if(this.isPlayerMax()){
			return;
		}
		this.player[id] = Object.create(Player);
		this.player[id].id = id;
		this.player[id].pid = Object.keys(this.player).length;
		//this.player[id].input = undefined;
		//this.clients[id] = client;

	}
	isPlayerMax(){
		return Object.keys(this.player).length >= PLAYER_NUM;
	}
	closeGame(){
		var format = {};
		format.type = 'end';
		this.broadcast(JSON.stringify(format));
	}
	//未使用
	/*
	getData(data){
		var id = data.id;
		var input = {};
		input.type = data.type;
		input.strong = data.strong;
		input.angle = data.angle;

	}
	broadcastCache(){
		for(var i = 0;i < this.cache.length; i++){
			this.broadcast(this.cache[i]);
		}
		this.cache = [];
	}
	processInput(){

		for (var id in this.player){
			if(this.player[id].input === undefined){
				continue;
			}
			var send = this.player[id].input;
			var frame = parseInt( ( Date.now() - this.time ) / 20 );
			send.frame = frame + 20;
			send.number = this.log.length;
			var format = {};
			format.type = 'input';
			format.data = send;
			this.cache.push(JSON.stringify(format));
			this.log.push(JSON.stringify(format));
			this.player[id].input = undefined;
		}
	}
	update(){
		this.frame += 1;
		if(this.frame > 0){
			this.processInput();
			this.broadcastCache();
		}

		return !this.start && this.frame >= 0;
	}
	checkFinish(){

			return this.frame > MAX_TIME;

	}*/

	
	
	//【データ型未対応】

	//【データ型未対応】

}

module.exports = GameMain;