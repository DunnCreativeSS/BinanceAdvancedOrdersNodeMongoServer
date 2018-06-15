var sleep = require('system-sleep');
var key;
var binance;
var secret;
var db;
var bolldiff = [];
const WebSocket = require('ws');

var bolldiffold = [];
var collections = [];
const nconf = require('nconf');
nconf.argv().env().file('keys.json');
var n = require('nonce')();
const user = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
var donenew = false;
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
var actedOn = [];
let uri = 'mongodb+srv://${user}:${pass}@${host}:${port}/test?retryWrites=true';
if (nconf.get('mongoDatabase')) {
    uri = `${uri}/${nconf.get('mongoDatabase')}`;

}
////console.log(uri);
uri = "mongodb://localhost/clients2";
uri = "mongodb+srv://jare:w0rdp4ss@cluster0-lp0jg.mongodb.net/clients2?retryWrites=true"

var mongodbip = uri;
////console.log(mongodbip);
const express = require('express');
const app = express();
var request = require("request")
var bodyParser = require('body-parser')
app.use('/media', express.static(__dirname + '/media'));
app.use(express.static(__dirname + '/public'));

const Binance = require('node-binance-api');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
var subbed = false;

app.set('view engine', 'ejs');
var MongoClient = require('mongodb').MongoClient;

app.post("/cancel", function(req, res) {
    var key = req.body.key;
    var secret = req.body.secret;
    var orderId = req.body.id;
    var binance = new Binance().options({
        APIKEY: key,
        APISECRET: secret,
        useServerTime: true
    });
    MongoClient.connect(mongodbip, function(err, db) {
        var dbo = db.db('clients2')

        ////console.log(key);
        var collection = dbo.collection(key);

        collection.update({
                "orderId": parseFloat(orderId)
            }, {
                "$set": {
                    "status": "cancelled"
                }
            }, {

            },
            function(err, result) {

                if (err) res.json({
                    "msg": "error"
                });
                res.json({
                    "msg": "success"
                });
            });

        //db.close()

    });
});
app.post('/registrationcheck', function(req, res) {
    var accountId = req.body.accountId;
    request.get("https://wallet1.burst-team.us:2083/burst?requestType=getSubscriptionsToAccount&account=10478801653490313100", function(error, response, body) {


        var subbed = false;
        ////console.log(body);
        for (var sub in JSON.parse(body).subscriptions) {
            ////console.log(JSON.parse(body).subscriptions[sub])
            if (JSON.parse(body).subscriptions[sub].sender == accountId && (JSON.parse(body).subscriptions[sub].amountNQT == '3600000000' || JSON.parse(body).subscriptions[sub].amountNQT == '20160000000' || JSON.parse(body).subscriptions[sub].amountNQT == '65520000000')) {

                subbed = true;
                res.json({
                    'message': 'success',
                    'yesno': true
                })
            } else {
                res.json({
                    'message': 'not subbed',
                    'yesno': false
                })
            }
        }

    });
})
app.post("/order", function(req, res) {
    var n = require('nonce')();

    var key = req.body.key;
    var secret = req.body.secret;
    var type = req.body.type;
    var method = req.body.method;
    var pair = req.body.pair;
    var trail = req.body.trail;
    var direction = req.body.direction;
    var tp = req.body.tp;
    var sl = req.body.sl;
    var limitprice = req.body.limitprice;
    var binance = new Binance().options({
        APIKEY: key,
        APISECRET: secret,
        useServerTime: true
    });
    binance.prices((error, ticker) => {
        var quantity = parseFloat(req.body.quantity);
        pair = pair.replace('_', '');
        MongoClient.connect(mongodbip, function(err, db) {
            var dbo = db.db('clients2')
            ////console.log(key);
            var collection = dbo.collection(key);
            ////console.log(direction);
            ////console.log(type);
            ////console.log(method);
            ////console.log('tp: ' + tp);
            ////console.log('sl: ' + sl);
            ////console.log(pair);
            ////console.log(quantity);
            ////console.log(limitprice);
            if (direction == "buy") {
                ////console.log('buy');
                if (type == "market") {
                    if (method == "sltp") {
                        binance.marketBuy(pair, quantity, (error, response) => {
                            if (error) {
                                res.json(JSON.parse(error.body));
                            }
                            ////console.log("Limit Buy response", response.body);
                            ////console.log("order id: " + response.orderId);
                            var orderid = response.orderId;
                            var myobj = {
                                orderId: response.orderId,
                                pair: pair,
                                tp: tp,
                                type: type,
                                method: method,
                                sl: sl,
                                direction: direction,
                                quantity: quantity,
                                status: 'effective'
                            };
                            collection.insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                //console.log(res);
                            });

                        });
                    } else if (method == 'trailing') {
                        if (ticker) {
                            var price = ticker[pair];
                            var n = require('nonce')();

                            if (direction == "buy") {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    limit: limitprice,
                                    trailstop: price * (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    method: method,
                                    direction: direction,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            } else {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    trailstop: price / (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    limit: limitprice,
                                    method: method,
                                    direction: direction,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            }
                            collection.insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                //console.log(res);
                            });
                        }
                    }

                } else if (type == "limit") {
                    ////console.log('limit');

                    if (method == "sltp") {
                        binance.buy(pair, quantity, limitprice, (error, response) => {
                            if (error) {
                                res.json(JSON.parse(error.body));
                            }
                            ////console.log("Limit Buy response", response.body);
                            ////console.log("order id: " + response.orderId);
                            var orderid = response.orderId;
                            var myobj = {
                                orderId: response.orderId,
                                pair: pair,
                                tp: tp,
                                sl: sl,
                                type: type,
                                method: method,
                                direction: direction,
                                quantity: quantity,
                                status: 'effective'
                            };
                            collection.insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                //console.log(res);
                            });

                        });
                    } else if (method == 'trailing') {

                        ////console.log('buy');
                        ////console.log(error);
                        if (ticker) {
                            var price = ticker[pair];
                            ////console.log(price);
                            var n = require('nonce')();
                            if (direction == "buy") {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    trailstop: price * (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    method: method,
                                    limit: limitprice,
                                    direction: direction,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            } else {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    trailstop: price / (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    method: method,
                                    direction: direction,
                                    limit: limitprice,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            }
                            collection.insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                console.log(res);
                            });
                        }

                    }

                }
            } else if (direction == "sell") {
                if (type == "market") {
                    if (method == "sltp") {
                        binance.marketSell(pair, quantity, (error, response) => {
                            if (error) {
                                res.json(JSON.parse(error.body));
                            }
                            ////console.log("Limit Buy response", response.body);
                            ////console.log("order id: " + response.orderId);
                            var orderid = response.orderId;
                            var myobj = {
                                orderId: response.orderId,
                                pair: pair,
                                tp: tp,
                                type: type,
                                method: method,
                                sl: sl,
                                direction: direction,
                                quantity: quantity,
                                status: 'effective'
                            };
                            collection.insertOne(myobj, function(err, res) {
                                if (err) conole.log(err);
                                //console.log(res);
                            });

                        });
                    } else if (method == 'trailing') {
                        if (ticker) {
                            var price = ticker[pair]
                            ////console.log(price);
                            var n = require('nonce')();

                            if (direction == "buy") {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    trailstop: price * (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    method: method,
                                    direction: direction,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            } else {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    trailstop: price / (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    method: method,
                                    direction: direction,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            }
                            collection.insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                //console.log(res);
                            });
                        }
                    }
                } else if (type == "limit") {
                    ////console.log('selll limit');
                    if (method == "sltp") {
                        binance.sell(pair, quantity, limitprice, (error, response) => {
                            if (error) {
                                res.json(JSON.parse(error.body));
                            }
                            ////console.log("Limit Buy response", response.body);
                            ////console.log("order id: " + response.orderId);
                            var orderid = response.orderId;
                            var myobj = {
                                orderId: response.orderId,
                                pair: pair,
                                tp: tp,
                                sl: sl,
                                type: type,
                                method: method,
                                direction: direction,
                                quantity: quantity,
                                status: 'effective'
                            };
                            collection.insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                //console.log(res);
                            });

                        });
                    } else if (method == 'trailing') {
                        ////console.log('trailing');
                        if (ticker) {
                            var price = ticker[pair]
                            var n = require('nonce')();
                            if (direction == "buy") {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    trailstop: price * (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    method: method,
                                    direction: direction,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            } else {
                                var myobj = {
                                    orderId: n(),
                                    highest: price,
                                    trailstop: price / (1 + (trail / 100)),
                                    trail: trail,
                                    pair: pair,
                                    type: type,
                                    method: method,
                                    direction: direction,
                                    quantity: quantity,
                                    status: 'effective'
                                };
                            }
                            collection.insertOne(myobj, function(err, res) {
                                if (err) console.log(err);
                                //console.log(res);
                            });
                        }

                    }
                }
            }
            //db.close();
        })
    })
});

app.post("/balances", function(req, res) {
    var key = req.body.key;
    var secret = req.body.secret;
    var base = req.body.base;
    var asset = req.body.asset;
    var binance = new Binance().options({
        APIKEY: key,
        APISECRET: secret,
        useServerTime: true
    }); // If you want to use sandbox mode where orders are simulated
    binance.balance((error, balances) => {
        if (error) res.json({
            'result': 'error'
        });
        else {
            if (balances[base]) {
				try {
                res.json({
                    "base": balances[base].available,
                    "asset": balances[asset].available
                });
				}catch(err){console.log(err);}
            }
        }
    });
});
app.post('/orders', function(req, res) {
    MongoClient.connect(mongodbip, function(err, db) {
        var dbo = db.db('clients2')
        var key = req.body.key;
        var secret = req.body.secret;
        ////console.log(key);
        var collection = dbo.collection(key); // get reference to the collection
        collection.find({

        }, {
            $exists: true
        }).toArray(function(err, doc) //find if a value exists
            {
                var arr = {};
                ////console.log(doc);
                for (var d in doc) {
                    if (req.body.pair == doc[d].pair) {
                        arr[doc[d].orderId] = {
                            tp: doc[d].tp,
                            sl: doc[d].sl,
                            trailstop: doc[d].trailstop,
                            type: doc[d].type,
                            method: doc[d].method,
                            direction: doc[d].direction,
                            quentity: doc[d].quantity,
                            status: doc[d].status
                        }
                    }
                }
                res.json(arr);
            })
        //db.close()
    })
});
app.post('/', function(req, res) {
    var key = req.body.key;
    var secret = req.body.secret;
    var binance = new Binance().options({
        APIKEY: key,
        APISECRET: secret,
        useServerTime: true
    }); // If you want to use sandbox mode where orders are simulated
    binance.prices((error, ticker) => {
			console.log(error);
        if (error) res.json({
            'result': 'error'
        });
        else {
            MongoClient.connect(mongodbip, function(err, db) {
                var dbo = db.db('clients2')
                ////console.log(key);

                dbo.collection(key).insert({
                    secret: secret,
                    key: key,
                }, function(err, res) {
                    if (err) throw err;
                    //console.log(res);
                });
                res.json({
                    'result': 'success'
                });
                //db.close()

            });
        }
    });
});

app.listen(8080, function() {});
var bolls = [];
var boll = require('bollinger-bands')
var boldiffold;
var ws = [];
WEB_SOCKET_SWF_LOCATION = "WebSocketMain.swf";
var abc = -1;
var docsitems = [];
var wss;
var opened = false;
function gogo(){
	docsitems = [];
	MongoClient.connect(mongodbip, function(err, db) {
            var dbo = db.db('clients2')
            dbo.listCollections().toArray(function(err, collInfos) {
                // collInfos is an array of collection info objects that look like:
                // { name: 'test', options: {} }
                collections = [];
                for (col in collInfos) {

                    //console.log(collInfos[col].name);
                    collections.push(dbo.collection(collInfos[col].name));
                }
				
for (var col in collections) {
    abc++;
    collections[col].find({}).toArray(function(err, doc) //find if a value exists
        {
			var string = "wss://stream.binance.com:9443/ws/"
             for (var i in doc) {
                    var obj = doc[i];
					for (var item in doc) {
                var obj3 = doc[item];
                //console.log(obj['pair']);
                if (doc[item].pair) {
					if (!docsitems.includes(doc[item].pair)){					console.log(doc[item].pair);

						docsitems.push(doc[item].pair);
						string+=doc[item].pair.toLowerCase() + "@ticker/"
				}}
					}
			 }
			string = string.substring(0, string.length - 1);
			console.log(string);
                    wss = (new WebSocket(string));
					
wss.onopen = function() {
console.log('open');
opened = true;
};
var objcount = [];
wss.onmessage = function(e) {
        var data = JSON.parse(e.data);
       // console.log(data);
			for (var c in collections){
            try {
collections[c].find({}).toArray(function(err, doc) //find if a value exists
        {
                for (var i in doc) {
					
                    var obj = doc[i];
					for (var item in doc) {
                var obj3 = doc[item];
                ////console.log(obj);
                if (doc[item]['key'] && doc[item]['secret']) {
                    key = obj3['key'];
                    secret = obj3['secret'];
                    //console.log(key);
                    ////////console.log(key);
                    //console.log(secret);
                    binance = new Binance().options({
                        APIKEY: obj3['key'],
                        APISECRET: obj3['secret'],
                        useServerTime: true
                    });
                }
                
			
					if (!objcount[obj['pair']]){
						objcount[obj['pair']] = 0;
					}
					objcount[obj['pair']]++;
					if (objcount[obj['pair']] >= 45){
						//console.log(obj['pair']);
						objcount[obj['pair']] = 0;
                    if (data.s == obj['pair']) {
						/*
					if (!bolls[obj['pair']]){
						bolls[obj['pair']] = [];
					}
					if (data.b > 0){
					bolls[obj['pair']].push(parseFloat(data.b));
					}
					//console.log('bolls: ' + bolls[obj['pair']]);
					if (bolls[obj['pair']].length >= 21){//1200
					//console.log(bolls[obj['pair']])
					var bollinger = (boll(bolls[obj['pair']]));
					//console.log(bollinger);
					bolldiffold[obj['pair']] = bolldiff[obj['pair']]
					bolldiff[obj['pair']] = parseFloat(data.b) - (bollinger.upper[bollinger.upper.length - 1] - bollinger.lower[bollinger.upper.length - 1]) - parseFloat(data.b); //
					//console.log('neg bolldiff? ' + bolldiff[obj['pair']] / bolldiffold[obj['pair']]); */
				//	}
                    //}
                    //console.log(error);
                    //console.log(obj['pair'] + ' - ' + data.s);
                        //console.log(obj);

                        //console.log('price: ' + (data.b));
                        //console.log('highest: ' + parseFloat(obj['highest']))
                       // console.log('trailstop: ' + obj['trailstop']);
                        //////console.log('tp: ' + obj['tp']);
                        //////console.log('sl: ' + obj['sl']);
                        //////console.log(' ');
                        var orderId = obj['orderId'];
                        if (obj['status'] == 'effective') {
                            //console.log(obj);
                            ////console.log('price: ' + parseFloat(data.b));
                            ////console.log('highest: ' + parseFloat(obj['highest']))
                            ////console.log('tp: ' + obj['tp']);
                            ////console.log('sl: ' + obj['sl']);
                            ////console.log(' ');
                            if (obj['direction'] == 'buy') {
                                // buy sltp
                                if (obj['highest']) {
                                    if (obj['method'] == 'trailing') {
                                        //console.log('trailstop: ' + obj['highest'] * (1 + (obj['trail'] / 100)));
                                        var trailstop = obj['highest'] * (1 + (obj['trail'] / 100));

                                        if (bolldiff[obj['pair']] / bolldiffold[obj['pair']] > 0 || bolldiff[obj['pair']] / bolldiffold[obj['pair']] < 0) {
                                            var boldiff;
                                            if (bolldiff[obj['pair']] / bolldiffold[obj['pair']] > 1) {
                                                boldiff = ((bolldiff[obj['pair']] / bolldiffold[obj['pair']] / 1500) + 1)
                                            } else {
                                                boldiff = -1 * ((bolldiff[obj['pair']] / bolldiffold[obj['pair']] / 1500) - 1)
                                            }
                                            if (boldiff <= 0.85 || boldiff >= 1.15) {
                                                //console.log('silly boldiff...');
                                                boldiff = boldiffold;
                                            } else {
                                                boldiffold = boldiff;
                                            }
                                            //console.log('bolldiff! ' + boldiff);
                                            trailstop = trailstop * (boldiff)
                                            collections[c].update({
                                                    "orderId": parseFloat(orderId)
                                                }, {
                                                    "$set": {
                                                        "trailstop": trailstop
                                                    }
                                                }, {

                                                },
                                                function(err, result) {

                                                });
                                        }
                                        if (obj['highest'] > data.b) {
											console.log(obj['pair']);
                                            console.log("trailstop " + obj['highest'] * (1 + (obj['trail'] / 100)));
                                            console.log("highest " + data.b);
											console.log(obj['pair']);
											console.log(c);
                                            collections[c].update({
                                                    "orderId": parseFloat(orderId)
                                                }, {
                                                    "$set": {
                                                        "highest": data.b,
                                                        "trailstop": obj['highest'] * (1 + (obj['trail'] / 100))
                                                    }
                                                }, {

                                                },
                                                function(err, result) {
													console.log(err);
													console.log(result.result);	
                                                });

                                        }
										
                                        if (data.b >= obj['trailstop'] && !actedOn.includes(obj['orderId'])) {
											actedOn.push(obj['orderId'])
                                            if (obj['type'] == "market") {

                                                binance.marketBuy(obj['pair'], obj['quantity']);

                                                collections[c].update({
                                                        "orderId": parseFloat(obj['orderId'])
                                                    }, {
                                                        "$set": {
                                                            "status": 'trail market'
                                                        }
                                                    }, {

                                                    },
                                                    function(err, result) {

                                                    });
                                            }
                                            if (obj['type'] == 'limit') {

                                                console.log(obj['pair'])
                                                console.log(obj['quantity'])
                                                console.log((parseFloat(obj['limit']) + parseFloat(data.b)));
                                                ////////console.log(data.b);
                                                ////////console.log(obj['highest'] / (1 + (obj['trail'] /100)));
                                                binance.marketBuy(obj['pair'], obj['quantity'], (error, response) => {
                                                }); //, (parseFloat(obj['limit']) + parseFloat(data.b)), {type:'LIMIT'}
                                                    if (true) {

                                                        var n = require('nonce')();

                                                        var myobj = {
                                                            orderId: n(),
                                                            pair: obj['pair'],
                                                            tp: obj['tp'],
                                                            sl: obj['s'],
                                                            type: obj['type'],
                                                            method: obj['method'],
                                                            direction: obj['direction'],
                                                            quantity: obj['quantity'],
                                                            status: 'trail limit'
                                                        };
                                                        collections[c].insertOne(myobj, function(err, res) {
                                                            if (err) {
                                                                //////console.log(err);
                                                            };
                                                            collections[c].update({
                                                                    "orderId": parseFloat(obj['orderId'])
                                                                }, {
                                                                    "$set": {
                                                                        "status": 'trail hit'
                                                                    }
                                                                }, {

                                                                },
                                                                function(err, result) {
                                                                });

                                                        });
                                                    } else {
                                                        console.log(error.body);
                                                    }

                                            }
                                        }
                                    }

                                }
                                if (parseFloat(data.b) >= obj['tp'] && obj['direction'] == 'buy' && !actedOn.includes(obj['orderId'])) {
											actedOn.push(obj['orderId'])

                                    ////////console.log(key);


                                    binance.marketSell(obj['pair'], obj['quantity']);
                                    collections[c].update({
                                        "orderId": parseFloat(orderId)
                                    }, {
                                        "$set": {
                                            "status": "tp"
                                        }
                                    }, {

                                    });
                                }
                                // buy sltp
                                if (parseFloat(data.b) <= obj['sl'] && obj['direction'] == 'buy' && !actedOn.includes(obj['orderId'])) {
											actedOn.push(obj['orderId'])


                                    binance.marketSell(obj['pair'], obj['quantity']);
                                    collections[c].update({
                                        "orderId": parseFloat(orderId)
                                    }, {
                                        "$set": {
                                            "status": "sl"
                                        }
                                    }, {

                                    });
                                }
                            }
                        }
                        if (obj['direction'] == 'sell') {
                            //////console.log(obj);

                            if (parseFloat(data.a) <= obj['tp'] && obj['direction'] == 'sell' && !actedOn.includes(obj['orderId'])) {
											actedOn.push(obj['orderId'])

                                //////console.log(obj);
                                ////////console.log(key);


                                binance.marketSell(obj['pair'], obj['quantity']);
                                collections[c].update({
                                    "orderId": parseFloat(orderId)
                                }, {
                                    "$set": {
                                        "status": "tp"
                                    }
                                }, {

                                });
                            }
                            // buy sltp
                            if (obj['method'] == 'sltp') {

                                //////console.log(parseFloat(data.a));
                                //////console.log(obj['sl']);
                                //////console.log(obj['tp']);
                            }
                            if (parseFloat(data.a) >= obj['sl'] && obj['direction'] == 'sell' && !actedOn.includes(obj['orderId'])) {
											actedOn.push(obj['orderId'])


                                binance.marketSell(obj['pair'], obj['quantity']);
                                collections[c].update({
                                    "orderId": parseFloat(orderId)
                                }, {
                                    "$set": {
                                        "status": "sl"
                                    }
                                }, {

                                });
                            } {
                                if (obj['highest']) {
                                    if (obj['method'] == "trailing") {
                                        if (data.a <= obj['trailstop'] && !actedOn.includes(obj['orderId'])) {
											actedOn.push(obj['orderId'])
                                            if (obj['type'] == "market") {

                                                binance.marketSell(obj['pair'], obj['quantity']);
                                                collections[c].update({
                                                    "orderId": parseFloat(orderId)
                                                }, {
                                                    "$set": {
                                                        "status": "trail market"
                                                    }
                                                }, {

                                                });
                                            }
                                        }
                                        if (obj['type'] == 'limit') {

                                            //	console.log("trailstop "+ obj['highest'] / (1 + (obj['trail'] / 100))); 
                                            //console.log("highest " + data.a);
                                            var trailstop = obj['highest'] / (1 + (obj['trail'] / 100));

                                            if (bolldiff[obj['pair']] / bolldiffold[obj['pair']] > 0 || bolldiff[obj['pair']] / bolldiffold[obj['pair']] < 0) {
                                                var boldiff;
                                                if (bolldiff[obj['pair']] / bolldiffold[obj['pair']] > 1) {
                                                    boldiff = ((bolldiff[obj['pair']] / bolldiffold[obj['pair']] / 1500) + 1)
                                                } else {
                                                    boldiff = -1 * ((bolldiff[obj['pair']] / bolldiffold[obj['pair']] / 1500) - 1)
                                                }
                                                if (boldiff <= 0.85 || boldiff >= 1.15) {
                                                    //console.log('silly boldiff...');
                                                    boldiff = boldiffold;
                                                } else {
                                                    boldiffold = boldiff;
                                                }
                                                //console.log('bolldiff! ' + boldiff);
                                                trailstop = trailstop * (boldiff)
                                                collections[c].update({
                                                        "orderId": parseFloat(orderId)
                                                    }, {
                                                        "$set": {
                                                            "trailstop": trailstop
                                                        }
                                                    }, {

                                                    },
                                                    function(err, result) {

                                                    });
                                            }

                                            if (obj['highest'] < data.a) {
												console.log(obj['pair']);
                                                console.log(data.a);
                                                console.log(obj['highest'] / (1 + (obj['trail'] / 100)));

                                                collections[c].update({
                                                        "orderId": parseFloat(orderId)
                                                    }, {
                                                        "$set": {
                                                            "highest": data.a,
                                                            "trailstop": obj['highest'] / (1 + (obj['trail'] / 100))
                                                        }
                                                    }, {

                                                    },
                                                    function(err, result) {

                                                    });
                                            }
                                            if (data.a <= obj['trailstop'] && !actedOn.includes(obj['orderId'])) {
											actedOn.push(obj['orderId'])
                                                console.log(obj['pair'])
                                                console.log(obj['quantity'])
                                                console.log((parseFloat(obj['limit']) + parseFloat(data.a)));
                                                binance.marketSell(obj['pair'], obj['quantity'], (error, response) => {
                                                }) //, (parseFloat(obj['limit']) + parseFloat(data.a)), {type:'LIMIT'}
                                                    ////////console.log("Limit Buy response", response.body);
                                                    ////////console.log("order id: " + response.orderId);
                                                    if (true) {
                                                        var n = require('nonce')();

                                                        var myobj = {
                                                            orderId: n(),
                                                            pair: obj['pair'],
                                                            tp: obj['tp'],
                                                            sl: obj['sl'],
                                                            type: obj['type'],
                                                            method: obj['method'],
                                                            direction: obj['direction'],
                                                            quantity: obj['quantity'],
                                                            status: 'trail limit'
                                                        };
                                                        collections[c].insertOne(myobj, function(err, res) {
                                                            if (err) {
                                                                //////console.log(err);
                                                            };
                                                            collections[c].update({
                                                                    "orderId": parseFloat(obj['orderId'])
                                                                }, {
                                                                    "$set": {
                                                                        "status": 'trail hit'
                                                                    }
                                                                }, {

                                                                },
                                                                function(err, result) {
                                                                });

                                                        });
                                                    } else {
                                                        console.log(error.body);
                                                    }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
		}
           
		}
		})
			}			catch (err) {
                console.log(err);
            }
        }
		}
		})
		
					}
                })
            })
}
gogo();
setInterval(function(){
	if (opened){
		opened = false;
	wss.close();
	}
        gogo();
			}, 60 * 5 * 1000);
			