import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Configure logger based on environment
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  enabled: process.env.NODE_ENV !== 'test',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  redact: {
    paths: [
      'password',
      'email',
      '*.password',
      '*.email',
      'headers.authorization',
      'req.headers.authorization',
      'body.password',
      'body.token',
    ],
    remove: true,
  },
  mixin() {
    return {
      service: 'pinklifesocial',
      environment: process.env.NODE_ENV,
    };
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  ...(isDevelopment ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        sync: true,
        mkdir: true
      }
    }
  } : {})
});

// Enhanced request logging middleware with synchronous logging
export const withLogging = (handler: Function) => {
  return async (...args: any[]) => {
    const request = args[0];
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    const startTime = Date.now();
    const requestData = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    };

    try {
      // Log request start
      logger.info({
        ...requestData,
        event: 'request_started',
      });
      
      const result = await handler(...args);
      
      // Log request completion
      logger.info({
        ...requestData,
        event: 'request_completed',
        statusCode: result.status,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      // Log errors
      logger.error({
        ...requestData,
        event: 'request_failed',
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: isDevelopment ? error.stack : undefined,
        } : 'Unknown error',
        duration: Date.now() - startTime,
      });

      throw error;
    }
  };
};

export { logger }; 