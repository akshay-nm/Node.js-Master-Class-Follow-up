// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Request handlers
var handlers = {};

// Users

// This is a container for sub-handlers for users
handlers._users = {};

// Users - post
// Required Fields: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
    // Validate reuired fields
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
                            callback(500, {'Error' : 'UNABLE TO CREATE NEW USER!'});
                        }
                    })
                } else {
                    callback(500, {'Error' : 'UNABLE TO HASH THE USER\'S PASSWORD'});
                }
            } else {
                callback(400, {'Error' : 'USER WITH THE PHONE NUMBER ALREADY EXISTS!'});
            }
        });
    } else {
        callback(400, {'Error': 'MISSING REQUIRED FIELDS!'});
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
        callback(400, {'Error' : 'MISSING REQUIRED FIELDS|'});
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
                            callback(500, {'Error': 'INTERNAL SERVER ERROR!'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'SPECIFIED USER DOES NOT EXIST!'});
                }
            });
        } else {
            callback(400, {'Error' : 'MISSING FIELDS TO UPDATE!'});
        }
    } else {
        callback(400, {'Error' : 'MISSING REQUIRED FIELD!'});
    }
};

// Users - DELETE
// Required data: phone
// Authenticated users only
handlers._users.delete = function(data, callback){
    // Check the required field
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    if(phone){
        _data.read('users', phone, function(err, userData){
            if(!err && userData){
                _data.delete('users',phone,function(err){
                    if(!err){
                        callback(200);
                    } else {
                        console.log('Error: ',err);
                        callback(500, {'Error': 'INTERNAL SERVER ERROR!'});
                    }
                });
            } else {
                callback(400, {'Error' : 'USER DOES NOT EXIST!'});
            }
        });
    } else {
        callback(400, {'Error' : 'MISSING REQUIRED FIELDS!'});
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