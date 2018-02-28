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

bot.on('text',(msg) => {
	if(msg.text === "Список" || msg.text === "/list")
	{
			listAPI(msg);
	}else if(msg.text === "Добавить" || msg.text === "/add")
		{
			changeAPIState(msg);
		}else if(msg.text === "/start")
			{
				checkUser(msg);
			}else 
				{
					addAPIToken(msg);
				}
});

function addAPIToken(msg)
{
	var id = msg.from.id;
	var txt;
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
		var dbo = db.db("Project_API");
		dbo.collection("bot_user_list").find({"from.id":id,'addAPIState':true}).toArray(function(err, result) {
			if (err) throw err;
			console.log(result.length);
			if(result.length == 0)
			{
				txt = "Не совсем понял вашу команду!";
				return bot.sendMessage(msg.from.id,txt);
			}
			else{
				registerAPI(msg,msg.text);
				updateAPIState(msg,false);
			}
		db.close();
		});
	});
}

function changeAPIState(msg)
{
	updateAPIState(msg,true);
	return bot.sendMessage(msg.from.id,"Напишите имя вашего приложения. В дальнейшем ваше приложение будет идентифицироватся через это имя:");
}

function checkUser(msg)
{
	var id = msg.from.id;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("Project_API");
		dbo.collection("bot_user_list").find({"from.id":id}).toArray(function(err, result)
		{
			if (err) throw err;
			console.log(result.length);
			if(result.length == 0)
			{
				registerUser(msg);
			}
			else
			{
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
	var dbo = db.db("Project_API");
		dbo.collection("user_api_coll").find({"user":id}).toArray(function(err, result) {
			if (err) throw err;
			if(result.length == 0)
			{
				console.log("Not");
				str = "У вас нету зарегистрированных токенов. Для регистрации нового токена нажмите кнопку 'Добавить' или воспользуйтесь командой /add";
				buildMenu(msg,str);
			}
			else{
				str = "Ваши приложения:\n";
				for(var i=0;i<result[0].APIs.length;i++){
				str = str +result[0].APIs[i].name + " - " + result[0].APIs[i].token + "\n";
				}
					buildMenu(msg,str);
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

function registerAPI(msg,name){
	var id = msg.from.id;
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("Project_API");
		dbo.collection("user_api_coll").find({"user":id}).toArray(function(err, result) {
			if (err) throw err;
			if(result.length == 0)
			{
				console.log("insert");
				registerNewAPI(msg.from.id,name,"insert");
			}
			else{
				console.log("update");
				registerNewAPI(msg.from.id,name,"update");
			}
		db.close();
		});
	});
}


function registerNewAPI(id,name,cond)
{
	var token = md5(id + name + Date.now());
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("Project_API");
	var myobj = {"user":id,
				 "APIs":[
					{"name":name,"token": token}
				]};
		if(cond === "insert"){
			dbo.collection("user_api_coll").insertOne(myobj, function(err, res) {
				if (err) throw err;
				console.log("1 document inserted");
				sendToken(id,name,token);
			db.close();
			});
		}
		if(cond === "update")
		{	
			console.log(name);
			dbo.collection("user_api_coll").find({"APIs.name":name}).toArray(function(err, result) {
				if (err) throw err;
				console.log(result.length);
				if(result.length > 0)
				{
					return bot.sendMessage(id,"У вас уже существует приложение с таким именем. Попробуйте другое имя. Ваша сессия была сброшана. Для добавления приложения воспользуйтесь кнопкой 'Добавить' или командой /add");
				}
				else{
					var query = {'user':id};
					var val = {$addToSet:{APIs:{"name":name,"token":token}}};

					dbo.collection("user_api_coll").update(query, val, function(err, res) {
						if (err) throw err;
						console.log("1 document updated");
						sendToken(id,name,token);
					db.close();
					});
				}
				db.close();
			});
		}
	});
}

function sendToken(id,name,token)
{
	var str = "Ваш токен для " + name + "\n" + token;
	return bot.sendMessage(id,str);
}

function registerUser(msg)
{
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("Project_API");
		var myobj = msg;
		dbo.collection("bot_user_list").insertOne(myobj, function(err, res) {
			if (err) throw err;
			console.log("1 document inserted");

		});
			updateAPIState(msg,false);
		});
	listAPI(msg);
}

function updateAPIState(msg,state)
{
	MongoClient.connect(url, function(err, db) {
	if (err) throw err;
		var dbo = db.db("Project_API");	
		var query = {'from.id':msg.from.id};
		var val = {$set:{addAPIState:state}};
		dbo.collection("bot_user_list").updateOne(query, val, function(err, res) {
			if (err) throw err;
			console.log("1 document updated");
		db.close();
		});
	});
}


bot.start();
