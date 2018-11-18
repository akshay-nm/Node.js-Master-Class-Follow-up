var environments = {};

// Staging environment configuration
environments.staging = {
    'httpPort' : 3000,
    'httpsPort': 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'AC3e1fba43ce08b0098e6b3e0ace1446ba',
        'authToken' : '22f6790b1b463d33e19ca2831a224265',
        'fromPhone' : '+14582214544'
    }
};

// Production environment configuration
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsAlsoASecret',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'AC3e1fba43ce08b0098e6b3e0ace1446ba',
        'authToken' : '22f6790b1b463d33e19ca2831a224265',
        'fromPhone' : '+14582214544'
    }
};

// Check if NODE_ENV was entered while running the app
var currentEnvironemnt = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Validate the NODE_ENV and select enviroment accordingly
var environmentToExport = typeof(environments[currentEnvironemnt]) == 'object' ? environments[currentEnvironemnt] : environments.staging;

module.exports = environmentToExport;