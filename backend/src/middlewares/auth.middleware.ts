import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, UserDocument } from "../models/user.model"; // Adjust path
import { asyncHandler } from "../utils/asyncHandler"; // Adjust path
import { ApiError } from "../utils/apiError"; // Adjust path

// Extend Express's Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}


export const verifyJWT = asyncHandler(async (req: Request, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request: No token provided");
  }

  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";
  
  const decodedToken = jwt.verify(token, accessTokenSecret) as JwtPayload;

  const user = await User.findById(decodedToken?._id).select("-passwordHash");

  if (!user) {
    throw new ApiError(401, "Invalid Access Token: User not found");
  }

  req.user = user; 
  next();
});


/**
 * Middleware factory to authorize users based on their roles.
 * @param {...("customer" | "end_user")} roles 
 */
export const authorizeRoles = (...roles: Array<"customer" | "end_user">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      throw new ApiError(401, "Authentication error: User data not found.");
    }
    
    if (!roles.includes(req.user.role as "customer" | "end_user")) {
      throw new ApiError(
        403, // 403 Forbidden
        `Role '${req.user.role}' is not authorized to access this route.`
      );
    }
    
    next();
  };
};