// Dependencies

var server = require('./lib/server');
var workers = require('./lib/workers');

var app = {};

// Initialization function
app.init = function(){
    server.init();
    workers.init();
};

// Execute the initialization function
app.init();


// Export the app
module.exports = app;