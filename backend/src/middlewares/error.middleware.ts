import { ApiError,ApiResponse } from "../utils/index";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";


export const errorMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) : void => {
  err.message = err.message || "Internal server error.";
  err.statusCode = err.statusCode || 500;

  if (err.name === "JsonWebTokenError") {
    err = new ApiError(400, "JSON Web Token is invalid. Try again.");
  }

  if (err.name === "TokenExpiredError") {
    err = new ApiError(400, "JSON Web Token has expired. Try again.");
  }

  if (err.name === "CastError") {
    err = new ApiError(400, `Invalid ${err.path}`);
  }

  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((e: any) => e.message)
        .join(" ")
    : err.message;

  res
    .status(err.statusCode)
    .json(new ApiResponse(err.statusCode, null, errorMessage));
};