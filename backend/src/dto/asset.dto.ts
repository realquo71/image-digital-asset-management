// Asset Data Transfer Objects
// Validates asset-related requests

import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  title!: string;
  description?: string;
  status?: AssetStatus;

  static validationSchema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(2000).optional().allow(''),
    status: Joi.string().valid('DRAFT', 'PUBLISHED').optional().default('DRAFT'),
  });

  static validate(data: unknown): CreateAssetDto {
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

export class UpdateAssetDto {
  title?: string;
  description?: string;
  status?: AssetStatus;

  static validationSchema = Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(2000).optional().allow(''),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional(),
  });

  static validate(data: unknown): UpdateAssetDto {
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

export class AssetSearchDto {
  page?: number;
  limit?: number;
  status?: AssetStatus;
  search?: string;
  creatorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'title' | 'fileSize';
  sortOrder?: 'asc' | 'desc';

  static validationSchema = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional(),
    search: Joi.string().max(200).optional(),
    creatorId: Joi.string().uuid().optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    sortBy: Joi.string().valid('createdAt', 'title', 'fileSize').optional().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
  });

  static validate(data: unknown): AssetSearchDto {
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

export class AddTagsDto {
  tags!: string[];

  static validationSchema = Joi.object({
    tags: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
  });

  static validate(data: unknown): AddTagsDto {
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
