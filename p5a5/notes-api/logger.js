const pino = require('pino');
const logger = pino(
  process.env.NODE_ENV === 'test'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: false, translateTime: 'SYS:standard' },
        },
      }
);

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
