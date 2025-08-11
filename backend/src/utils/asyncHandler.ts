import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncHandler = (
    handler: (
        req: Request,
        res: Response,
        next: NextFunction
    ) => Promise<unknown>
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};

export { asyncHandler };