var environments = {};

// Staging environment configuration
environments.staging = {
    'httpPort' : 3000,
    'httpsPort': 3001,
    'envName' : 'staging'
};

// Production environment configuration
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production'
};

// Check if NODE_ENV was entered while running the app
var currentEnvironemnt = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Validate the NODE_ENV and select enviroment accordingly
var environmentToExport = typeof(environments[currentEnvironemnt]) == 'object' ? environments[currentEnvironemnt] : environments.staging;

module.exports = environmentToExport;