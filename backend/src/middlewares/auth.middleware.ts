import { ApiError, asyncHandler,AuthRequest } from "../utils";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken";

interface IUser {
    username: string;
    _id: string;
}

export const authMiddleware = asyncHandler(async (req:AuthRequest, _, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unothorized request");
    }

    const JWT_PASSWORD = process.env.ACCESS_TOKEN_SECRET;

    try {
        const decodedToken = jwt.verify(token, JWT_PASSWORD as string) as IUser;

        const user = await User.findById(decodedToken?._id).select("-password");
        if (!user) {
            throw new ApiError(401, "Invalid Access token");
        }
        req.user = user;
        next();
    } catch (err) {
        throw new ApiError(401, "Invalid Access token");
    }
});