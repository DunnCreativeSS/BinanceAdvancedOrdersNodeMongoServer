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
    MongoClient.connect("mongodb://localhost:27017/clients", function(err, db) {
        var dbo = db.db('clients')

        console.log(key);
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


    });
});
app.post('/registrationcheck', function (req, res){
	var accountId = req.body.accountId;
	  request.get("https://wallet1.burst-team.us:2083/burst?requestType=getSubscriptionsToAccount&account=10478801653490313100", function(error, response, body) {
	  
	  
        var subbed = false;
		console.log(body);
            for (var sub in JSON.parse(body).subscriptions) {
                console.log(JSON.parse(body).subscriptions[sub])
                if (JSON.parse(body).subscriptions[sub].sender == accountId && ( JSON.parse(body).subscriptions[sub].amountNQT == '3600000000' || JSON.parse(body).subscriptions[sub].amountNQT == '20160000000' || JSON.parse(body).subscriptions[sub].amountNQT == '65520000000')) {
					
                    subbed = true;
					res.json({'message': 'success', 'yesno': true})
                } else {
					res.json({'message': 'not subbed', 'yesno': false})
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
            var quantity = parseFloat(req.body.quantity);
            var binance = new Binance().options({
                APIKEY: key,
                APISECRET: secret,
                useServerTime: true
            });
            pair = pair.replace('_', '');
            MongoClient.connect("mongodb://localhost:27017/clients", function(err, db) {
                    var dbo = db.db('clients')
                    console.log(key);
                    var collection = dbo.collection(key);
                    console.log(direction);
                    console.log(type);
                    console.log(method);
                    console.log('tp: ' + tp);
                    console.log('sl: ' + sl);
                    console.log(pair);
                    console.log(quantity);
                    console.log(limitprice);
                    if (direction == "buy") {
                        console.log('buy');
                        if (type == "market") {
                            if (method == "sltp") {
                                binance.marketBuy(pair, quantity, (error, response) => {
                                    if (error) {
                                        res.json(JSON.parse(error.body));
                                    }
                                    if (!error) {
                                        console.log("Limit Buy response", response.body);
                                        console.log("order id: " + response.orderId);
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
                                            console.log(res);
                                        });
                                    }
                                });
                            } else if (method == 'trailing') {
                                binance.prices((error, ticker) => {
                                    if (ticker) {
                                        var price = ticker[pair];
                                        var myobj = {
                                            orderId: n(),
                                            highest: price,
                                            trail: trail,
                                            pair: pair,
                                            type: type,
                                            method: method,
                                            direction: direction,
                                            quantity: quantity,
                                            status: 'effective'
                                        };
                                        collection.insertOne(myobj, function(err, res) {
                                            if (err) throw err;
                                            console.log(res);
                                        });
                                    }
                                });
                            }

                        } else if (type == "limit") {
                            console.log('limit');

                            if (method == "sltp") {
                                binance.buy(pair, quantity, limitprice, (error, response) => {
                                    if (error) {
                                        res.json(JSON.parse(error.body));
                                    }
                                    if (!error) {
                                        console.log("Limit Buy response", response.body);
                                        console.log("order id: " + response.orderId);
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
                                            console.log(res);
                                        });
                                    }
                                });
                            } else if (method == 'trailing') {

                                console.log('buy');
                                binance.prices((error, ticker) => {
                                    if (ticker) {
                                        var price = ticker[pair];
                                        var myobj = {
                                            orderId: n(),
                                            limit: limitprice,
                                            highest: price,
                                            trail: trail,
                                            pair: pair,
                                            type: type,
                                            method: method,
                                            direction: direction,
                                            quantity: quantity,
                                            status: 'effective'
                                        };
                                        collection.insertOne(myobj, function(err, res) {
                                            if (err) throw err;
                                            console.log(res);
                                        });
                                    }
                                });
                            }

                        }
                    } else if (direction == "sell") {
                        if (type == "market") {
                            if (method == "sltp") {
                                binance.marketSell(pair, quantity, (error, response) => {
                                    if (error) {
                                        res.json(JSON.parse(error.body));
                                    }
                                    if (!error) {
                                        console.log("Limit Buy response", response.body);
                                        console.log("order id: " + response.orderId);
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
                                            console.log(res);
                                        });
                                    }
                                });
                            } else if (method == 'trailing') {
                                binance.prices((error, ticker) => {
                                    if (ticker) {
                                        var price = ticker[pair];
                                        var myobj = {
                                            orderId: n(),
                                            highest: price,
                                            trail: trail,
                                            pair: pair,
                                            type: type,
                                            method: method,
                                            direction: direction,
                                            quantity: quantity,
                                            status: 'effective'
                                        };
                                        collection.insertOne(myobj, function(err, res) {
                                            if (err) console.log(err);
                                            console.log(res);
                                        });
                                    }
                                });
                            }
                        } else if (type == "limit") {
                            console.log('selll limit');
                            if (method == "sltp") {
                                binance.sell(pair, quantity, limitprice, (error, response) => {
                                    if (error) {
                                        res.json(JSON.parse(error.body));
                                    }
                                    if (!error) {
                                        console.log("Limit Buy response", response.body);
                                        console.log("order id: " + response.orderId);
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
                                            console.log(res);
                                        });
                                    }
                                });
                            } else if (method == 'trailing') {
                                console.log('trailing');
                                binance.prices((error, ticker) => {
                                    if (ticker) {
                                        var price = ticker[pair];
                                        var n = require('nonce')();

                                        var myobj = {
                                            orderId: n(),
                                            highest: price,
                                            limit: limitprice,
                                            trail: trail,
                                            pair: pair,
                                            type: type,
                                            method: method,
                                            direction: direction,
                                            quantity: quantity,
                                            status: 'effective'
                                        };
                                        collection.insertOne(myobj, function(err, res) {
                                            if (err) console.log(err);
                                            console.log(res);
                                        });
                                    }
                                });

                            }
                        }
                    }

                })
            })
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
                        res.json({
                            "base": balances[base].available,
                            "asset": balances[asset].available
                        });
                    }
                }
            });
        }); app.post('/orders', function(req, res) {
            MongoClient.connect("mongodb://localhost:27017/clients", function(err, db) {
                var dbo = db.db('clients')
                var key = req.body.key;
                var secret = req.body.secret;
                console.log(key);
                var collection = dbo.collection(key); // get reference to the collection
                collection.find({

                }, {
                    $exists: true
                }).toArray(function(err, doc) //find if a value exists
                    {
                        var arr = {};
                        console.log(doc);
                        for (var d in doc) {
                            if (req.body.pair == doc[d].pair) {
                                arr[doc[d].orderId] = {
                                    tp: doc[d].tp,
                                    sl: doc[d].sl,

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
            })
        }); app.post('/', function(req, res) {
            var key = req.body.key;
            var secret = req.body.secret;
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
                    MongoClient.connect("mongodb://localhost:27017/clients", function(err, db) {
                        var dbo = db.db('clients')
                        console.log(key);

                        dbo.collection(key).insert({
                            secret: secret,
                            key: key,
                        }, function(err, res) {
                            if (err) throw err;
                            console.log(res);
                        });
                        res.json({
                            'result': 'success'
                        });

                    });
                }
            });
        });

        app.listen(80, function() {});
