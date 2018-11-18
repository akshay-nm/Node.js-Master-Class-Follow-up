// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Request handlers
var handlers = {};

// Users

// This is a container for sub-handlers for users
handlers._users = {};

// Users - post
// Required Fields: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
    // Validate required fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length  > 0 ? data.payload.password : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesn't already exist
        _data.read('users', phone, function(err, data){
            if(err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if(hashedPassword){
                    var userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Unable to create new user'});
                        }
                    })
                } else {
                    callback(500, {'Error' : 'Unable to has the user\'s password'});
                }
            } else {
                callback(400, {'Error' : 'User with specified phone number already exists'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Users - GET
// Required data: phone
// Optional data: none
// Only let authenticated users access their object.
handlers._users.get = function(data, callback) {
    // check that the phoe number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    if (phone) {

        // Get the token from the headers
        var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;
        // Verify that the toke is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
                _data.read('users', phone, function(err, data){
                    if(!err && data){
                        // Remove the hashed password from the user object before returning it
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404)
                    }
                });
            } else {
                callback(403, {'Error' : 'Misisng required token in the header, or the token has expired'});
            }
        })
        
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password
// Atleast one optional data must be specified
// Only let users update their own data
handlers._users.put = function(data, callback) {
    // Check for the required field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;

    if(phone){

        var token = typeof(data.headers.token) == 'string' ? data.headers.token && data.headers.token.trim().length == 20 : false;

        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
                // Check for optional data
                var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
                var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
                var password = typeof(data.payload.password) == 'string' && data.payload.password.trime().length > 0 ? data.payload.password : false;

                if(firstName || lastName || password) {
                    // Check if the user exists by reading the file
                    _data.read('users',phone,function(err, userData){
                        if(!err && userData){
                            if(firstName) {
                                userData.firstName = firstName;
                            }
                            if(lastName) {
                                userData.lastName = lastName;
                            }
                            if(password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                        
                            _data.update('users', phone, userData, function(err){
                                if(!err){
                                    callback(200);
                                } else {
                                    console.log('Error: ',err);
                                    callback(500, {'Error': 'Unable to update details of the specified user'});
                                }
                            });
                        } else {
                            callback(400, {'Error': 'Could not find the specified user'});
                        }
                    });
                } else {
                    callback(400, {'Error' : 'Missing fields to update'});
                }
            } else {
                callback(403, {'Error' : 'Missing required token in the header, or the token has expired'});
            }
        })

        
    } else {
        callback(400, {'Error' : 'Missing requried fields'});
    }
};

// Users - DELETE
// Required data: phone
// Authenticated users only
handlers._users.delete = function(data, callback){
    // Check the required field
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    if(phone){

        var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, function(isTokenValid){
            if(isTokenValid){
                _data.read('users', phone, function(err, userData){
                    if(!err && userData){
                        
                        _data.delete('users',phone,function(err){
                            if(!err){

                                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                                var checksToBeDeleted = userCheck.length;
                                var deletionErrors = false;
                                var checksDeleted = 0;

                                userChecks.forEach(checkId => {
                                    _data.delete('checks', checkId, function(err){
                                        deletionErrors = true;
                                    });
                                    checksDeleted ++;
                                    if(checksDeleted == checksToBeDeleted){
                                        if(!deletionErrors){
                                            callback(200);
                                        } else {
                                            callback(500, {'Error' : 'Unable to delete all checks from the system associated with the user'});
                                        }
                                    }
                                });
                            } else {
                                callback(500, {'Error': 'Unable to delete the specified user\'s data'});
                            }
                        });
                    } else {
                        callback(400, {'Error' : 'Could not find the specified user'});
                    }
                });
            } else {
                callback(403, {'Error' : 'Misisng required token in the header, or the token has expired'});
            }
        });
        
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

handlers.users = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};











// Token handlers
handlers.tokens = function(data, callback){
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for token sub-handlers
handlers._tokens = {};

// Tokens - POST
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.password : false;

    if(phone && password){

        // Lookup the user 
        _data.read('users', phone, function(err, userData){
            if(!err && userData){

                // Validate the password
                if(userData.hashedPassword == helpers.hash(password)){
                    
                    // Create the token with a random name. Set expiration date 1 hour in the future.
                    var id = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;

                    var tokenObject = {
                        'phone' : phone,
                        'id' : id,
                        'expires' : expires
                    }

                    // Store the token
                    _data.create('tokens', id, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error':'Could not create new token'});
                        }
                    })
                } else {
                    callback(400, {'Error' : 'Incorrect password'});
                }

            } else {
                callback(400, {'Error' : 'Could not find the specified user'})
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Tokens - GET
// Required data : tokenId
// Optional data : none
handlers._tokens.get = function(data, callback){    
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if(id) {
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                callback(200, tokenData);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Tokens - PUT
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;

    if(id && extend) {
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){

                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, tokenData, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            callback(500, {'Error' : 'Unable to extend the token expiration'});
                        }
                    })
                } else {
                    callback(400, {'Error' : 'Specified Token already expired'});
                }
            } else {
                callback(400, {'Error' : 'Specified Token does not exist'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields or fields are invalid'});
    }
};

// Tokens - DELETE
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
    if(id){
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                _data.delete('tokens',id,function(err){
                    if(!err){
                        callback(200);
                    } else {
                        console.log('Error: ',err);
                        callback(500, {'Error': 'Could not delete the specified token'});
                    }
                });
            } else {
                callback(400, {'Error' : 'Token does not exist'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Verify if a given token is valid
handlers._tokens.verifyToken = function(id, phone, callback){
    _data.read('tokens', id, function(err, tokenData){
        if(!err && tokenData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}




// Checks handlers
handlers.checks = function(data, callback){
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers._checks = {};


// Checks - POST
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
// Enforce max 5 checks limit
handlers._checks.post = function(data, callback){
    // Validate all these inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
    var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

    if(protocol && url && method && successCodes && timeoutSeconds) {
        // Check the token
        var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;

        // Lookup the user by reading the token
        _data.read('tokens', token, function(err, tokenData){
            if(!err && tokenData){
                _data.read('users', tokenData.phone, function(err, userData){
                    var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                    // Verify that the user has less than the max number of allowed checks
                    if(userChecks.length < config.maxChecks){
                        var checkId = helpers.createRandomString(20);
                        // Create the check object and include the users phone
                        var checkObject = {
                            'id' : checkId,
                            'userPhone' : userData.phone,
                            'protocol' : protocol,
                            'method' : method,
                            'url' : url,
                            'successCodes' : successCodes,
                            'timeoutSeconds' : timeoutSeconds
                        }

                        _data.create('checks', checkId, checkObject, function(err){
                            if(!err){
                                userData.checks = userChecks;
                                userData.checks.push(checkId);

                                _data.update('users', userData.phone, userData, function(err){
                                    if(!err){
                                        callback(200, checkObject);
                                    } else {
                                        callback(500, {'Error' : 'Could not update the user with the new check'});
                                    }
                                })
                                
                            } else {
                                callback(500, {'Error' : 'Could not create the check'});
                            }
                        });
                    } else {
                        callback(400, {'Error' : 'User already has maximum number of allowed checks ('+ config.maxChecks +').' });
                    }
                })
            } else {
                callback(403);
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required inputs or inputs are invalid'});
    }
};

// Check - GET
// Required data: id
// Optional data: none
handlers._checks.get = function(data, callback){
    // check that the phoe number is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        // lookup the check
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){

                // Get the token from the headers
                var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;
                // Verify that the token is valid and belongs to the user who created the check

                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                })
            } else {
                callback(404);
            }
        });

        
        
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Checks - PUT
// Required data: id
// Optional data: protocol, successCodes, timeoutSeconds, method (one must be set)
handlers._checks.put = function(data, callback){

    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;

    // Check for the required field
    if(id){
 
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;
 
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        // Check for optional data
                        var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
                        var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
                        var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
                        var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
                        var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;
        
                        if(protocol || url || method || successCodes || timeoutSeconds) {
                            // Check if the user exists by reading the file
                            _data.read('checks', id, function(err, checkData){
                                if(!err && checkData){
                                    if(protocol) {
                                        checksData.protocol = protocol;
                                    }
                                    if(url) {
                                        checkData.url = url;
                                    }
                                    if(successCodes) {
                                        checkData.successCodes = successCodes;
                                    }
                                    if(method) {
                                        checkData.method = method;
                                    }
                                    if(timeoutSeconds) {
                                        checkData.timeoutSeconds = timeoutSeconds;
                                    }
                                    
                                    // Store the updates
                                    _data.update('checks', id, checkData, function(err){
                                        if(!err){
                                            callback(200);
                                        } else {
                                            callback(500, {'Error': 'Unable to update the check'});
                                        }
                                    });
                                } else {
                                    callback(400, {'Error': 'Could not find the specified user'});
                                }
                            });
                        } else {
                            callback(400, {'Error' : 'Missing fields to update'});
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        })

        
 
         
    } else {
        callback(400, {'Error' : 'Missing requried fields'});
    }

};

// Checks - DELETE
// Required data: id
// optional data: none
handlers._checks.delete = function(data, callback){
    // Check the required field
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if(id){

        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;

                handlers._tokens.verifyToken(token, checkData.userPhone, function(isTokenValid){
                    if(isTokenValid){

                        _data.delete('checks', id, function(err){
                            if(!err){
                                _data.read('users', checkData.userPhone, function(err, userData){
                                    if(!err && userData){
                                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : false;

                                        var checkPosition = userChecks.indexOf(id);

                                        if(checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);

                                            userData.checks = userChecks;
                                            _data.update('users', checkData.userPhone, userData, function(err){
                                                if(!err){
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error' : 'Could not update the userObject'});
                                                }
                                            })
                                        } else {
                                            callback(500, {'Error': 'Could not find the check on the userObject'});
                                        }
                                    } else {
                                        callback(500, {'Error' : ' Could not find the user who created the check'});
                                    }
                                })
                            } else {
                                callback(500, {'Error' : 'Could not delete the specified check'});
                            }
                        });

                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        })
        
        
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};





// We only need to send a status code when a client is pinging the server
handlers.ping = function(data, callback){
    callback(200);
}

// Not payload, only status code 404
handlers.notFound = function(data, callback){
    callback(404);
}

// Export the handlers
module.exports = handlers;