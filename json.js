
uri = "mongodb+srv://jare:w0rdp4ss@cluster0-lp0jg.mongodb.net/clients?retryWrites=true"
console.log(uri);

var binance;
const Binance = require('binance-api-node').default

// Authenticated client, can make signed calls


var mongodbip = uri;

var MongoClient = require('mongodb').MongoClient;
async function xyz (){
MongoClient.connect(mongodbip, function(err, db) {
 var dbo = db.db('clients')
    setInterval(function() {
        dbo.listCollections().toArray(function(err, collInfos) {
			console.log(collInfos.length);
		for (var col in collInfos){
			console.log(collInfos[col].name);
		}
		console.log(' ');
		});
	
	}, 10000);
});
}
xyz();
	