/** 
 * These are worker related tasks
 */

var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var helpers = require('./helpers');
var _data = require('./data');
var url = require('url');

// Instantiate the worker object
var workers = {};

// Look up all the checks, get that data and send it to a validator
workers.gatherAllChecks = function(){
    // get all the checks
    _data.list('checks', function(err, checks){
        if(!err && checks && checks.length > 0){
            checks.forEach(checkId => {
                _data.read('checks', checkId, function(err, originalCheckData){
                    if(!err && originalCheckData){
                        // Pass the check data to validator
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log("Error: Unable to read check data for check:", checkId);
                    }
                })
            });
        } else {
            console.log("Error: Could not find any checks")
        }
    });
}

// Sanity-Check for checkData
workers.validateCheckData = function(originalCheckData) {
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5? originalCheckData.timeoutSeconds : false;

    // Set the keys that might not be set (if the worker has never seen this check before)
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // if all the checks pass, pass the data along to the next step in the process
    if(originalCheckData.id && 
        originalCheckData.userPhone &&
        originalCheckData.protocol && 
        originalCheckData.method && 
        originalCheckData.url && 
        originalCheckData.successCodes &&
        originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);    
    } else {
        console.log("Check Validation Error: Check data was insane...\n"+originalCheckData.userPhone +":"
        +originalCheckData.protocol +":" 
        +originalCheckData.method +":"
        +originalCheckData.url +":"
        +originalCheckData.successCodes +":"
        +originalCheckData.timeoutSeconds+":"
        +originalCheckData.state +":"
        +originalCheckData.lastChecked);
    }
}

workers.performCheck = function(originalCheckData){
    // Prepare the initial check outcome
    var checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    // Mark that the outcome has not been sent yet
    var outcomeSent = false;

    // Parse the hostname and the path out of the original check data
    var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);

    var hostName = parsedUrl.hostname;
    var path = parsedUrl.path;

    var requestDetails = {
        'protocol' : originalCheckData.protocol+':',
        'hostname' : hostName,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000
    };

    // Instantiate the request object (using either http or https module)
    var moduleToUse = originalCheckData.protocol == 'http' ? http : https;

    var req = moduleToUse.request(requestDetails , function(res){
        var status = res.statusCode;

        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        } 

        
    });
    
    // Bind to the error event so that it doesnt get thrown
    req.on('error', function(e){
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : e
        };
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the timeout event
    req.on('timeout', function(e){
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : 'timeout'
        };
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // End the request
    req.end();
};

// Process the checkOutcome and update the check data as needed, trigger an alert to the user if needed
// If a check that has never been tested before, dont alert the user
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
    // Decide if the check is up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    
    // Decide if an alert is needed
    var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    
    // Update the checkData
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();


    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if(!err){
            if(alertWarranted){
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log("Outcome not changed. Alert not required");
            }
        } else {
            console.log("Error: unable to update the check data")
        }
    })
}

// Alert the user as to a change in thier check
workers.alertUserToStatusChange = function(newCheckData) {
    var msg = 'Alert: Your check data for '+ newCheckData.method.toUpperCase() +' '+ newCheckData.protocol+ '://'+ newCheckData.url+' is currently '+ newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
        if(!err){
            console.log("Alert Sent!");
        } else {
            console.log("Could not sent alert\n"+newCheckData.userPhone +":"+msg+":"+err);
        }
    });
}

// This is a timer to execute the worker process once per minute
workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    }, 1000 * 5);
}

// Init workers
workers.init = function() {
    // Execute all the checks immediately
    workers.gatherAllChecks();

    // Call the loop so that the checks will execute later on
    workers.loop();
}


// Export the workers
module.exports = workers;