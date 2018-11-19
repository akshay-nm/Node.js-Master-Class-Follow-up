/**
 * These are server related tasks
 */

var config = require('./config');
var handlers = require('./handlers');
var helpers = require('./helpers');

var fs = require('fs');
var path = require('path');

var http = require('http');
var https = require('https');

var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;



var server = {};


server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
});





// Making opnessl key-cert in https directory accessible
server.httpsServerConfig = {
    'key' : fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerConfig, function(req, res){
    server.unifiedServer(req, res);
});













server.unifiedServer = function(req, res){ 
    
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

        var chosenhandler = typeof(server.router[trimmedPath]) != 'undefined' ? server.router[trimmedPath] : handlers.notFound;

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
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
};

server.init = function(){
    // Start the http server
    server.httpServer.listen(config.httpPort, function(){
        console.log('HTTP Server Started!\nPORT: ' + config.httpPort);
    });
    
    server.httpsServer.listen(config.httpsPort, function(){
        console.log('HTTPS Server Started!\nPORT: ' + config.httpsPort);
    });

}

module.exports = server;