const Binance = require('node-binance-api');
var sleep = require('system-sleep');
var key;
var binance;
var secret;
var MongoClient = require('mongodb').MongoClient;
function doBinance(binance, i, doc, collection){
	 binance.prices((error, ticker) => {
		 var obj = doc[i]
                                    //console.log(error);
                                    if (ticker) {
                                        //console.log ('price: ' + parseFloat(ticker[obj['pair']]));
                                        //console.log('highest: ' + parseFloat(obj['highest']))
                                        //console.log('tp: ' + obj['tp']);
                                        //console.log('sl: ' + obj['sl']);
                                        //console.log(' ');
                                        var orderId = obj['orderId'];
                                        if (obj['status'] != 'cancelled' && obj['status'] != 'sp' && obj['status'] != 'tp' && obj['status'] != 'trail market' && obj['status'] != 'trail limit') {
											console.log(obj);
                                       console.log ('price: ' + parseFloat(ticker[obj['pair']]));
                                        console.log('highest: ' + parseFloat(obj['highest']))
                                        console.log('tp: ' + obj['tp']);
                                        console.log('sl: ' + obj['sl']);
                                        console.log(' ');
                                            if (obj['direction'] == 'buy') {
                                                // buy sltp
                                                if (obj['highest']) {
                                                    if (obj['method'] == 'trailing') {
                                                        if (ticker[obj['pair']] <= obj['highest'] / (1 + (obj['trail'] / 100))) {
                                                            if (obj['type'] == "market") {

                                                                binance.marketBuy(obj['pair'], obj['quantity']);

                                                                collection.update({
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

                                                            ////console.log(ticker[obj['pair']]);
                                                            ////console.log(obj['highest'] / (1 + (obj['trail'] /100)));

                                                            binance.buy(obj['pair'], obj['quantity'], parseFloat(obj['limit']) + parseFloat(ticker[obj['pair']], (error, response) => {
                                                                if (error) {
                                                                    //console.log(error)
                                                                }
                                                                if (!error) {
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
                                                                        status: 'trail limit'
                                                                    };
                                                                    collection.insertOne(myobj, function(err, res) {
                                                                        if (err) {
                                                                            //console.log(err);
                                                                        };
                                                                        collection.update({
																				"orderId": parseFloat(obj['orderId'])
																			}, {
																				"$set": {
																					"status": 'trail hit'
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
                                                                }
                                                            }));
                                                        }
                                                    }
                                                    if (obj['highest'] > ticker[obj['pair']]) {
                                                        collection.update({
                                                            "orderId": parseFloat(orderId)
                                                        }, {
                                                            "$set": {
                                                                "highest": ticker[obj['pair']]
                                                            }
                                                        }, {
                                                            
                                                        });

                                                    }
                                                }
                                                if (parseFloat(ticker[obj['pair']]) >= obj['tp'] && obj['direction'] == 'buy') {

                                                    ////console.log(key);


                                                    binance.marketSell(obj['pair'], obj['quantity']);
                                                    collection.update({
                                                        "orderId": parseFloat(orderId)
                                                    }, {
                                                        "$set": {
                                                            "status": "tp"
                                                        }
                                                    }, {
                                                        
                                                    });
                                                }
                                                // buy sltp
                                                if (parseFloat(ticker[obj['pair']]) <= obj['sl'] && obj['direction'] == 'buy') {


                                                    binance.marketSell(obj['pair'], obj['quantity']);
                                                    collection.update({
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
                                        //console.log(obj);

                                            if (parseFloat(ticker[obj['pair']]) <= obj['tp'] && obj['direction'] == 'sell') {

                                                //console.log(obj);
                                                ////console.log(key);


                                                binance.marketSell(obj['pair'], obj['quantity']);
                                                collection.update({
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

                                                //console.log(parseFloat(ticker[obj['pair']]));
                                                //console.log(obj['sl']);
                                                //console.log(obj['tp']);
                                            }
                                            if (parseFloat(ticker[obj['pair']]) >= obj['sl'] && obj['direction'] == 'sell') {


                                                binance.marketSell(obj['pair'], obj['quantity']);
                                                collection.update({
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
                                                        if (ticker[obj['pair']] <= obj['highest'] / (1 + (obj['trail'] / 100))) {
                                                            if (obj['type'] == "market") {

                                                                binance.marketSEll(obj['pair'], obj['quantity']);
                                                                collection.update({
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

                                                            console.log(ticker[obj['pair']]);
                                                            console.log(obj['highest'] / (1 + (obj['trail'] /100)));
                                                            if (ticker[obj['pair']] <= obj['highest'] / (1 + (obj['trail'] / 100))) {
                                                                binance.sell(obj['pair'], obj['quantity'], parseFloat(obj['limit']) + parseFloat(ticker[obj['pair']], (error, response) => {
                                                                    if (error) {
                                                                        //console.log(error)
                                                                    }
                                                                    if (!error) {
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
                                                                            status: 'trail limit'
                                                                        };
                                                                        collection.insertOne(myobj, function(err, res) {
                                                                            if (err) {
                                                                                //console.log(err);
                                                                            };
                                                                            collection.update({
																				"orderId": parseFloat(obj['orderId'])
																			}, {
																				"$set": {
																					"status": 'trail hit'
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
                                                                    }
                                                                }));
                                                            }
                                                        }
                                                        if (obj['highest'] < ticker[obj['pair']]) {
                                                            collection.update({
                                                                "orderId": parseFloat(orderId)
                                                            }, {
                                                                "$set": {
                                                                    "highest": ticker[obj['pair']]
                                                                }
                                                            }, {
                                                                
                                                            });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
									if ((i + 1) >= doc.length){
										
									}
									else{
									doBinance(binance, i + 1, doc, collection)
									}
                                });
}
MongoClient.connect("mongodb://localhost:27017/clients", function(err, db) {
    var dbo = db.db('clients')
    setInterval(function() {
        dbo.listCollections().toArray(function(err, collInfos) {
            // collInfos is an array of collection info objects that look like:
            // { name: 'test', options: {} }
            for (col in collInfos) {

                ////console.log(collInfos[col].name);
                var collection = dbo.collection(collInfos[col].name);


                collection.find({} ).toArray(function(err, doc) //find if a value exists
                    {
                        for (var item in doc) {
                            ////console.log(item);
                            var obj = doc[item];
                            ////console.log(obj);
                            if (doc[item]['key'] && doc[item]['secret']) {
                                key = obj['key'];
                                secret = obj['secret'];
                                ////console.log(key);
                                ////console.log(key);
                                //////console.log(secret);
                                binance = new Binance().options({
                                    APIKEY: obj['key'],
                                    APISECRET: obj['secret'],
                                    useServerTime: true
                                });
                            }
                        }
                        for (var item in doc) {
                            ////console.log(item);
                            var obj = doc[item];
                            if (binance && obj['status'] == 'effective') {
                               doBinance(binance, 0, doc, collection);
                            }
                        }
                    });
            }
        });
    }, 5000);
})
