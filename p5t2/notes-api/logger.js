// ============================================================
// logger.js
// Structured request logging with pino. Every request gets ONE
// log line, emitted on 'finish' so the ACTUAL final status code
// is captured regardless of whether the response came from a
// normal route or the error handler.
// ============================================================

const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: false, translateTime: 'SYS:standard' },
  },
});

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      },
      'request completed'
    );
  });

  next();
}

module.exports = { logger, requestLogger };
