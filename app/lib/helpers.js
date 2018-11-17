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


// Export the helpers
module.exports = helpers;