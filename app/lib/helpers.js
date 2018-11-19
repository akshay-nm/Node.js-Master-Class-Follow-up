/**
 * Helpers for various tasks
*/

// Dependencies
var config = require('./config');

var crypto = require('crypto');
var querystring = require('querystring');
var https = require('https');



// Container for all the helpers
var helpers = {};



// Create a SHA256 hash
helpers.hash = function(str) {
    if(typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse the JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try{
        var object = JSON.parse(str);
        return object;
    } catch(e){
        return {};
    }
}

// Create a String of random alphanumeric characters of a given length
helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        // Define all possible characters that could go to the string
        var possibleCharacter = "abcdefghijklmnopqrstuvwxyz0123456789";

        var str = '';
        for( i = 0; i < strLength ; i ++ ){
            // get a random character from the possibleCharacters string
           
            var randomCharacter = possibleCharacter.charAt(Math.floor(Math.random() * possibleCharacter.length));

            // append this character to the final string
            str += randomCharacter;
        }
        // Return the final string
        return str;
    } else {
        return false;
    }
}

// Send an SMS via twilio

helpers.sendTwilioSms = function(phone, msg, callback) {
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg : false;

    if(phone && msg){
        // Configure the request payload that we want to send to twilio

        var payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+91' + phone,
            'Body' : msg
        };

        // Stringify
        var stringPayload = querystring.stringify(payload);

        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        var req = https.request(requestDetails, function(res){
            // Grab the status of the sent request
            var status = res.statusCode;

            // Callback successfully if the request went through
            if(status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was:'+status+":"+phone+":"+msg);
            }
        });

        // Bind to the error event so it doesnt get thrown
        req.on('error', function(e){
            callback('Error:',e);
        });

        req.write(stringPayload);

        req.end();

    } else {
        callback('Given parameters were missing of invalid');
    }
}


// Export the helpers
module.exports = helpers;