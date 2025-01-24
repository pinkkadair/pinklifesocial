export const productionConfig = {
  security: {
    // Rate limiting
    rateLimit: {
      window: 60 * 1000, // 1 minute
      max: 100, // requests per window
      standardHeaders: true,
      legacyHeaders: false,
    },

    // Session configuration
    session: {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      updateAge: 24 * 60 * 60, // 24 hours
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
      },
    },

    // CORS configuration
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },

    // Upload limits
    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
      ],
    },

    // Database connection
    database: {
      poolMin: 2,
      poolMax: 10,
      connectionTimeout: 10000,
      idleTimeout: 60000,
    },

    // Redis configuration
    redis: {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      disconnectTimeout: 2000,
    },

    // Error reporting
    errorReporting: {
      captureUnhandledRejections: true,
      captureUncaughtExceptions: true,
      stackTraceLimit: 50,
      includeHeaders: false, // Don't include headers in error reports
    },

    // Logging
    logging: {
      level: 'info',
      redact: [
        'password',
        'email',
        '*.password',
        '*.email',
        'headers.authorization',
        'body.token',
      ],
      retention: '30d',
    },
  },

  // Performance tuning
  performance: {
    compression: true,
    minify: true,
    cache: {
      ttl: 3600, // 1 hour
      staleWhileRevalidate: 60, // 1 minute
    },
  },

  // Monitoring
  monitoring: {
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      unhealthyThreshold: 3,
      healthyThreshold: 2,
    },
    metrics: {
      enabled: true,
      collectDefault: true,
      prefix: 'pinklifesocial_',
    },
  },
} as const;

// Type for the config
export type ProductionConfig = typeof productionConfig;

// Helper to get config values
export function getConfig<K extends keyof ProductionConfig>(key: K): ProductionConfig[K] {
  return productionConfig[key];
} 