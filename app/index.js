/*
* This is the entry point for Node
*/

var config = require('./lib/config');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

var fs = require('fs');

var http = require('http');
var https = require('https');

var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;





var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);
});





// Making opnessl key-cert in https directory accessible
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
    
    /**
     * URL - Uniform Resource Location (web address)
     * The url module we imported earlier parses the URL information in the request. 
     * 
     * A typical HTTP request contains a lot of information which can be accessed using 
     * the 'req' object in this method. We are interested in getting the following:
     *  - path
     *  - method
     *  - query
     *  - headers
     *  - payload
     * */
    var parsedUrl = url.parse(req.url, true);

    var path = parsedUrl.pathname;
    
    // Trim the path using a regex
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    var queryStringObject = parsedUrl.query;

    var method = req.method.toLowerCase();

    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    // This function will handle the response to be sent to the client 
    req.on('end', function(data){
        buffer += decoder.end();

        var data = {
            'path' : trimmedPath,
            'method' : method,
            'queryStringObject' : queryStringObject,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        var chosenhandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;

        chosenhandler(data, function(statusCode, payload){
            // Validating the statuscode passed by handler
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Valdiating the payload passed by the handler
            payload = typeof(payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);
            
            // Response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log('Response: ', payloadString);
        });
    });
}




// Request router
var router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
};