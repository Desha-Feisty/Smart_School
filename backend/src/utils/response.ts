import type { Response } from "express";

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
): Response<ApiResponse<T>> => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
    });
};

export const sendCreated = <T>(
    res: Response,
    data: T,
    message = "Created successfully",
): Response<ApiResponse<T>> => {
    return res.status(201).json({
        success: true,
        data,
        message,
    });
};

export const sendPaginated = <T>(
    res: Response,
    data: T,
    page: number,
    limit: number,
    total: number,
    message?: string,
): Response<PaginatedResponse<T>> => {
    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
        message,
    });
};

export const sendError = (
    res: Response,
    message: string,
    statusCode = 400,
    error?: string,
): Response<ApiResponse> => {
    return res.status(statusCode).json({
        success: false,
        error: error || message,
        message,
    });
};

export const sendNotFound = (res: Response, resource = "Resource"): Response<ApiResponse> => {
    return sendError(res, `${resource} not found`, 404);
};

export const sendUnauthorized = (res: Response, message = "Unauthorized"): Response<ApiResponse> => {
    return sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message = "Forbidden"): Response<ApiResponse> => {
    return sendError(res, message, 403);
};

export const sendValidationError = (
    res: Response,
    message = "Validation failed",
    errors?: unknown,
): Response<ApiResponse> => {
    const response: Record<string, unknown> = {
        success: false,
        error: "Validation Error",
        message,
    };
    if (errors) {
        response.details = errors;
    }
    return res.status(400).json(response);
};

export const sendConflict = (res: Response, message: string): Response<ApiResponse> => {
    return sendError(res, message, 409);
};

export const sendInternalError = (
    res: Response,
    message = "Internal server error",
    isDev = process.env.NODE_ENV === "development",
): Response<ApiResponse> => {
    return res.status(500).json({
        success: false,
        error: isDev ? message : "Internal server error",
        message: isDev ? message : "Something went wrong",
    });
};