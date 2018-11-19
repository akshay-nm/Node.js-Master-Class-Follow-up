/**
 * Library for string the and editing
*/

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers')

// Container for the module (to be exported)
var lib = {};

// Define the base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write the data to a file
lib.create = function(dir, file, data, callback) {
    
    //Open the file for WRITING
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // Convert data to string
            var stringData = JSON.stringify(data);

            // Write the data into the file
            fs.writeFile(fileDescriptor, stringData, function(err){
                if(!err){
                    fs.close(fileDescriptor, function(err) {
                        if(!err){
                            callback(false);
                        } else {
                            callback('Unable to close file');
                        }
                    });
                } else {
                    callback('Unable to write file');
                }
            })
        } else {
            callback('File already exists');
        }
    });
};


// Read the data from a file
lib.read = function(dir, file, callback) {
    // Open the file for READING
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function(err, data){
        if(!err && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else{
            callback(err, data);
        }
    });
};

// Update the data in an existing file
lib.update = function(dir, file, data, callback){
    // Open the file for UPDATING
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor){
        if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);

            // Truncate the file to remove existing content
            fs.truncate(fileDescriptor, function(err){
                if(!err){
                    fs.writeFile(fileDescriptor, stringData, function(err){
                        if(!err){
                            fs.close(fileDescriptor, function(err){
                                if(!err){
                                    callback(false);
                                } else {
                                    callback('Unable to close file after update');
                                }
                            });
                        } else {
                            callback('Unable to write on existing file');
                        }
                    });
                } else {
                    callback('Unable to truncate file');
                }
            });
        } else {
            callback('Could not open file for update, it may not exist');
        }
    });
};

// Delete a file
lib.delete = function(dir, file, callback){
    // unlink the file 
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err){
        if(!err){
            callback(false);
        } else {
            callback('Unable to delete the file');
        }
    })
}

// List all the items in a directory
lib.list = function(dir, callback) {
    fs.readdir(lib.baseDir + dir + '/', function(err, data){
        if(!err && data){
            var trimmedFileName = [];
            data.forEach(fileName => {
                trimmedFileName.push(fileName.replace('.json',''));
            });
            // @TODO: Find a cleaner way to do this
            // Remove .gitignore file from list
            var i = trimmedFileName.indexOf(".gitignore");
            if(i > -1){
                trimmedFileName.splice(i, 1);
            }
            callback(false, trimmedFileName);
        } else {
            callback(err, data);
        }
    })
}


// Export the module
module.exports = lib;