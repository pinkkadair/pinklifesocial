import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Configure logger based on environment
const pinoConfig = {
  level: process.env.LOG_LEVEL || 'info',
  enabled: process.env.NODE_ENV !== 'test',
  formatters: {
    level: (label: string) => ({ level: label }),
    bindings: () => ({}),
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  browser: {
    asObject: true,
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
      'data.password',
      'data.token',
    ],
    remove: true,
  },
};

// Create logger instance without worker threads for Next.js compatibility
export const logger = isDevelopment
  ? pino({
      ...pinoConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    })
  : pino({
      ...pinoConfig,
      // Disable worker threads in production
      browser: {
        ...pinoConfig.browser,
        write: (o) => {
          // In production, you might want to send logs to a logging service
          // For now, we'll just use console
          console.log(JSON.stringify(o));
        },
      },
    });

// Enhanced request logging middleware
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
      logger.info({ ...requestData, event: 'request_started' }, 'Request started');
      
      const result = await handler(...args);
      
      logger.info({
        ...requestData,
        event: 'request_completed',
        statusCode: result.status,
        duration: Date.now() - startTime,
      }, 'Request completed');

      return result;
    } catch (error) {
      logger.error({
        ...requestData,
        event: 'request_failed',
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: isDevelopment ? error.stack : undefined,
        } : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Request failed');

      throw error;
    }
  };
}; 