import joi from "joi";
import type { Request, Response, NextFunction } from "express";
import { sendValidationError } from "../utils/response.js";

interface ValidationSchemas {
    body?: joi.ObjectSchema;
    query?: joi.ObjectSchema;
    params?: joi.ObjectSchema;
}

export const validate = (schemas: ValidationSchemas) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: Record<string, string[]> = {};

        // Validate body
        if (schemas.body) {
            const { error, value } = schemas.body.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                error.details.forEach((detail) => {
                    const field = detail.path.join(".");
                    if (!errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push(detail.message);
                });
            } else {
                req.body = value;
            }
        }

        // Validate query
        if (schemas.query) {
            const { error, value } = schemas.query.validate(req.query, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                error.details.forEach((detail) => {
                    const field = detail.path.join(".");
                    if (!errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push(detail.message);
                });
            } else {
                req.query = value;
            }
        }

        // Validate params
        if (schemas.params) {
            const { error, value } = schemas.params.validate(req.params, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                error.details.forEach((detail) => {
                    const field = detail.path.join(".");
                    if (!errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push(detail.message);
                });
            } else {
                req.params = value;
            }
        }

        // If there are validation errors, return them
        if (Object.keys(errors).length > 0) {
            const formattedErrors: Record<string, string> = {};
            Object.entries(errors).forEach(([field, messages]) => {
                formattedErrors[field] = messages[0] || "Invalid value";
            });

            return sendValidationError(
                res,
                "Validation failed",
                formattedErrors,
            ) as unknown as void;
        }

        next();
    };
};

// Common validation schemas
export const commonSchemas = {
    idParam: joi.object({
        id: joi.string().hex().length(24).required(),
    }),

    pagination: joi.object({
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(10),
        sort: joi.string().optional(),
        order: joi.string().valid("asc", "desc").default("desc"),
    }),

    search: joi.object({
        search: joi.string().allow(""),
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(10),
    }),
};

// Helper to create pagination response
export const getPaginationParams = (query: {
    page?: string | number;
    limit?: string | number;
    sort?: string;
    order?: string;
}) => {
    const page = Math.max(1, parseInt(String(query.page || "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || "10"), 10)));
    const skip = (page - 1) * limit;
    const sort = query.sort || "createdAt";
    const order = query.order === "asc" ? 1 : -1;

    return { page, limit, skip, sort: sort as string, order };
};