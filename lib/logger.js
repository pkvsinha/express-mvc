const winston = require('winston');

// Log level
winston.level = process.env.LOG_LEVEL || 'debug';
const logger = new winston.Logger(({
  transports: winston.transports.Console({
    level: winston.level,
    timestampt: () => (new Date()).toISOString()
  })
}));
module.exports = logger;
