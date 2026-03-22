const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

if (process.env.LOG_FILE) {
  logger.add(new winston.transports.File({ filename: process.env.LOG_FILE }));
}

module.exports = logger;
