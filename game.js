//Pirates Clash
//correct gunner

var ws = require('ws');

var PLAYER_NUM = 2;
//---------------------------------------------------------------------
//datadefine
var Input 	  = { id:'', type:'input', strong:0, angle:0 ,frame:0};//input skip
var Player 	  = { id:'', charge:0};
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
	constructor(){
		this.player = {};
		this.client = {};
		this.frame = 0;
		this.requestInput = [];
	}
	update(){
		this.frame += 1;

	}
	//【データ型未対応】
	inputCalc(id,type,strong,angle){
		var obj = Object.create(Input);
		obj.id = id;
		obj.strong = strong;
		obj.angle = angle;
		obj.frame = this.frame + 2;
		this.requestInput.push(obj);
	}
	//【データ型未対応】
	getData(data){
		var id = data.id;
		var input = {};
		input.type = data.type;
		input.strong = data.strong;
		input.angle = data.angle;

	}
	playerEntry(id,client){
		this.player[id] = new Player(id);
		this.client[id] = client;
	}
	isPlayerMax(){
		return Object.keys(this.player).length >= PLAYER_NUM;
	}
}

module.exports = GameMain;