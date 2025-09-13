class AppError extends Error {
  constructor(message, statusCode = 500, error = "AppError", details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, "ValidationError", details);
  }
}

class AuthError extends AppError {
  constructor(message, details = {}) {
    super(message, 401, "AuthError", details);
  }
}

class NotFoundError extends AppError {
  constructor(message, details = {}) {
    super(message, 404, "NotFoundError", details);
  }
}

module.exports = { AppError, ValidationError, AuthError, NotFoundError };
