class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details) {
    super(400, message);
    this.details = details;
  }
}

module.exports = { ApiError, NotFoundError, ValidationError };
