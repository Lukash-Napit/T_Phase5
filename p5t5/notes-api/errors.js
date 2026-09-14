// ============================================================
// errors.js
// Custom error classes -- each one just carries a statusCode
// alongside the normal Error message. Routes throw/forward
// these; they never format a response themselves.
// ============================================================

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    // Ensures err.name is the actual subclass name (e.g.
    // "NotFoundError") rather than the generic "Error" -- this is
    // what lets the centralized handler use err.name as the
    // response's `code` field without any extra bookkeeping.
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
