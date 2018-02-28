const TeleBot = require("telebot");
const md5 = require('md5');
// Retrieve
var MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

const bot = new TeleBot({
    token: '460201887:AAE4NKqNyZwh6gNXm_lhjW1cinPC_VojNCA', // Required. Telegram Bot API token.
    polling: { // Optional. Use polling.
        proxy: 'http://10.20.0.109:3128' // Optional. An HTTP proxy to be used.
    }
});

bot.on('/start',(msg) => {
	checkUser(msg);
	//registerUser(msg);
	//return bot.sendMessage(msg.from.id,"");
});

function checkUser(msg)
{
	var id = msg.from.id;
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("TestAPI");
		dbo.collection("bot_user_list").find({"from.id":id}).toArray(function(err, result) {
			if (err) throw err;
			console.log(result.length);
			if(result.length == 0)
			{
			console.log("New");
				registerUser(msg);
			}
			else{
				console.log("Old");
				listAPI(msg);
			}
		db.close();
		});
	});
}

function listAPI(msg){
	
	var id = msg.from.id;
	var str;
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("TestAPI");
		dbo.collection("user_api_coll").find({"user":id}).toArray(function(err, result) {
			console.log(result.length);
			if (err) throw err;
			if(result.length == 0)
			{
				console.log("Not");
				str = "У вас нету зарегистрированных токенов. Для регистрации нового токена нажмите кнопку 'Добавить' или воспользуйтесь командой /add";
				buildMenu(msg,str);
			}
			else{
				MongoClient.connect(url, function(err, db) {
				if (err) throw err;
				var dbo = db.db("TestAPI");
					dbo.collection("user_api_coll").find({"user":id}).toArray(function(err, result) {
						if (err) throw err;
						str = result;
					});
				});
			}
		db.close();
		});
	});



}

function buildMenu(msg,str)
{
	console.log("Menu");
		let replyMarkup = bot.keyboard([
			['Список','Добавить'],
		], {resize: true});
		return bot.sendMessage(msg.from.id, str, {replyMarkup});
}

function registerAPI(msg){
	var id = msg.from.id;
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("TestAPI");
		dbo.collection("user_api_coll").find({"user":id}).toArray(function(err, result) {
			if (err) throw err;
			if(result.length == 0)
			{
				registerNewAPI(msg);
			}
			else{
				registerAPI(msg);
			}
		db.close();
		});
	});
}


function registerNewAPI(msg)
{
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("TestAPI");
	var api_name;
	var token = md5(msg.from.id + api_name + Date.now());
	var myobj = {"user":msg.from.id,
				 "APIs":[
					{"name":"1APIName","token": token}
				]};

		dbo.collection("user_api_coll").insertOne(myobj, function(err, res) {
			if (err) throw err;
			console.log("1 document inserted");
		db.close();
	});
});
}

function registerUser(msg)
{
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("TestAPI");
	var myobj = msg;
		dbo.collection("bot_user_list").insertOne(myobj, function(err, res) {
			if (err) throw err;
			console.log("1 document inserted");
		db.close();
		});
	});
}


bot.start();
