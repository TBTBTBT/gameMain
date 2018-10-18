//Pirates Clash
//correct gunner

var ws = require('ws');

var PLAYER_NUM = 2;
var MAX_TIME = 150;
//---------------------------------------------------------------------
//datadefine
var Input 	  = { id:'', type:'input', strong:0, angle:0 ,frame:0};//input skip
var Player 	  = { id:'', input: {} ,charge:0};
var SendInput = { type: 'input', data:{ id:'', type:'input', strong:0, angle:0, frame:0} };

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
//
class GameMain {
	constructor(server){
		this.player = {};
		//this.clients = {};
		this.frame = -30;
		this.cache = [];
		this.log = [];
		this.start = false;
		this.server = server;
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

	}
	processInput(){
		for (var id in this.player){
			if(this.player[id].input === undefined){
				continue;
			}
			var send = this.player[id].input;
			send.frame = this.frame + 3;
			var format = {};
			format.type = 'input';
			format.data = send;
			this.cache.push(JSON.stringify(format));
			this.log.push(JSON.stringify(format));
			this.player[id].input = undefined;
		}
	}
	broadcastCache(){
		for(var i = 0;i < this.cache.length; i++){
			this.broadcast(this.cache[i]);
		}
		this.cache = [];
	}
	broadcast(msg){
		for (var id in this.player){
			if(this.server.clients[id] === undefined){
				continue;
			}
			this.server.sendMessage(id,msg);
		}
	}
	//【データ型未対応】
	input(id,type,strong,angle){
		
		if(this.player[id].input !== undefined){
			return;
		}
		if(type == "bullet" ){
			var obj = Object.create(Input);
			obj.id = id;
			obj.strong = strong;
			obj.angle = angle;
			this.player[id].input = obj;
		}
	}
	//【データ型未対応】
	getData(data){
		var id = data.id;
		var input = {};
		input.type = data.type;
		input.strong = data.strong;
		input.angle = data.angle;

	}
	playerEntry(id){
		if(this.isPlayerMax()){
			return;
		}
		this.player[id] = Object.create(Player);
		this.player[id].id = id;
		this.player[id].input = undefined;
		//this.clients[id] = client;

	}
	isPlayerMax(){
		return Object.keys(this.player).length >= PLAYER_NUM;
	}
}

module.exports = GameMain;