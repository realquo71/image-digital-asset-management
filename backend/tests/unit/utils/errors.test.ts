// Unit tests for error utility classes

import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,
  ServiceUnavailableError,
} from '../../../src/utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(500, 'Test error', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.isOperational).toBe(true);
    });

    it('should have stack trace', () => {
      const error = new AppError(500, 'Test error');

      expect(error.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with resource info', () => {
      const error = new NotFoundError('Asset', 'abc-123');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Asset with identifier 'abc-123' not found");
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error with validation details', () => {
      const details = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' },
      ];

      const error = new ValidationError(details);

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error', () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid credentials');

      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');

      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('BadRequestError', () => {
    it('should create 400 error', () => {
      const error = new BadRequestError('Invalid request body');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid request body');
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('InternalServerError', () => {
    it('should create 500 error', () => {
      const error = new InternalServerError();

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });

    it('should accept custom message', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create 503 error', () => {
      const error = new ServiceUnavailableError('Redis');

      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Redis is currently unavailable');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });
});
