import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt ,{ Secret, SignOptions } from "jsonwebtoken";

import { User, UserDocument } from "../models/user.model"; // Adjust path as needed
import { asyncHandler } from "../utils/asyncHandler"; // Adjust path as needed
import { ApiError } from "../utils/apiError"; // Adjust path as needed
import { ApiResponse } from "../utils/apiResponse"; // Adjust path as needed

// --- Helper Function to Generate Tokens ---
    
const generateAccessAndRefreshTokens = async (userId: string): Promise<{ accessToken: string; refreshToken: string }> => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found while generating tokens");
        }

        // 🚨 Ensure these secrets are in your .env file
        const accessTokenSecret:Secret  = process.env.ACCESS_TOKEN_SECRET as string ;
        const refreshTokenSecret: Secret  = process.env.REFRESH_TOKEN_SECRET as string ;

        const accessToken = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                role: user.role,
            },
            accessTokenSecret,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" } as SignOptions
        );

        const refreshToken = jwt.sign(
            {
                _id: user._id,
            },
            refreshTokenSecret ,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" } as SignOptions
        );
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens", [error]);
    }
};


// --- Signup Controller ---

// Zod schema for signup request body validation
const signupBodySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate request body using Zod
    const validationResult = signupBodySchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ApiError(400, "Validation failed", validationResult.error.errors);
    }
    const { name, email, phone, password } = validationResult.data;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists"); // 409 Conflict
    }

    // 3. Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create the user in the database
    const user = await User.create({
        name,
        email,
        phone,
        passwordHash,
    });

    // 5. Retrieve the created user (without the password)
    const createdUser = await User.findById(user._id).select("-passwordHash");

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    // 6. Send the successful response
    return res
        .status(201) // 201 Created
        .json(new ApiResponse(201, createdUser, "User registered successfully"));
});


// --- Signin Controller ---

// Zod schema for signin request body validation
const signinBodySchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate request body
    const validationResult = signinBodySchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ApiError(400, "Validation failed", validationResult.error.errors);
    }
    const { email, password } = validationResult.data;

    // 2. Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist"); // 404 Not Found
    }

    // 3. Compare the provided password with the stored hash
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials"); // 401 Unauthorized
    }

    // 4. Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // 5. Prepare user data for the response (without sensitive info)
    const loggedInUser = await User.findById(user._id).select("-passwordHash");
    
    // 6. Define options for setting cookies (recommended for security)
    const cookieOptions = {
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        secure: process.env.NODE_ENV === "production", // Only sends the cookie over HTTPS
    };

    // 7. Send cookies and the JSON response
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});