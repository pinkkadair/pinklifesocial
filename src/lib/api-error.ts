export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code || this.name,
        statusCode: this.statusCode,
      },
    };
  }
} 