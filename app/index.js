/*
* This is the entry point for Node
*/

var config = require('./config');
var fs = require('fs');

var http = require('http');
var https = require('https');

var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);
});

var httpsServerConfig = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerConfig, function(req, res){
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function(){
    console.log('HTTP Server Started!\nPORT: ' + config.httpPort);
});

httpsServer.listen(config.httpsPort, function(){
    console.log('HTTPS Server Started!\nPORT: ' + config.httpsPort);
});

var unifiedServer = function(req, res){ 

}