const TeleBot = require("telebot");
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
			if(result.length == 0)
			{registerUser(msg);}
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
