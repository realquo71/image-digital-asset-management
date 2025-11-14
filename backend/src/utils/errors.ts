// Custom error classes for the application
// Provides typed errors with HTTP status codes

import { ValidationErrorDetail } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(
      404,
      `${resource} with identifier '${identifier}' not found`,
      'NOT_FOUND'
    );
  }
}

export class ValidationError extends AppError {
  constructor(public details: ValidationErrorDetail[]) {
    super(400, 'Validation failed', 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message, 'BAD_REQUEST');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR', false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(503, `${service} is currently unavailable`, 'SERVICE_UNAVAILABLE');
  }
}
