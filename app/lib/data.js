/**
 * Library for string the and editing
*/

// Dependencies
var fs = require('fs');
var path = require('path');

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
                            callback('UNABLE TO CLOSE FILE!');
                        }
                    });
                } else {
                    callback('UNABLE TO WRITE TO FILE!');
                }
            })
        } else {
            callback('FILE ALREADY EXISTS');
        }
    });
};


// Read the data from a file
lib.read = function(dir, file, callback) {
    // Open the file for READING
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function(err, data){
        callback(err, data);
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
                                    callback('UNABLE TO CLOSE THE FILE AFTER UPDATE!');
                                }
                            });
                        } else {
                            callback('UNABLE TO WRITE DATA TO EXISTING FILE!');
                        }
                    });
                } else {
                    callback('UNABLE TO TRUNCATE FILE!');
                }
            });
        } else {
            callback('COULD NOT OPEN FILE FOR UDPATE! IT MAY NOT EXIST YET!');
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
            callback('UNABLE TO DELETE THE FILE!');
        }
    })
}



// Export the module
module.exports = lib;