/**
 * Helpers for various tasks
*/

// Dependencies
var config = require('./config');

var crypto = require('crypto');




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

// Export the helpers
module.exports = helpers;