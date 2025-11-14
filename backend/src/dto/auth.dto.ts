// Authentication Data Transfer Objects
// Validates authentication-related requests

import Joi from 'joi';
import { ValidationError } from '../utils/errors';

export class AzureAuthCallbackDto {
  code!: string;
  redirectUri!: string;

  static validationSchema = Joi.object({
    code: Joi.string().required(),
    redirectUri: Joi.string().uri().required(),
  });

  static validate(data: unknown): AzureAuthCallbackDto {
    const { error, value } = this.validationSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ValidationError(
        error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }))
      );
    }

    return value;
  }
}

export class RefreshTokenDto {
  refreshToken!: string;

  static validationSchema = Joi.object({
    refreshToken: Joi.string().required(),
  });

  static validate(data: unknown): RefreshTokenDto {
    const { error, value } = this.validationSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ValidationError(
        error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }))
      );
    }

    return value;
  }
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
