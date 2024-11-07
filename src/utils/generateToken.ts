import jwt from "jsonwebtoken";
import { IUserDocument } from "../models/user.model";
import { Response } from "express";

// Function to generate a JWT token and set it as an HTTP-only cookie
export const generateToken = (res: Response, user: IUserDocument) => {
  // Step 1: Create a JWT token that includes the user's ID as payload
  // The secret key and expiry time are retrieved from environment variables
  const token = jwt.sign(
    { userId: user._id },                    // Payload: user's unique ID
    process.env.ACCESS_TOKEN_SECRET!,        // Secret key for signing the token
    process.env.ACCESS_TOKEN_EXPIRY          // Token expiration time
  );

  // Step 2: Set the token in a cookie with security options
  // - httpOnly: ensures the cookie is not accessible by client-side JavaScript
  // - sameSite: "strict" to prevent cross-site request forgery (CSRF)
  // - maxAge: set to 24 hours (in milliseconds) to control cookie expiration
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
  });

  // Step 3: Return the generated token for use if needed elsewhere in the application
  return token;
};
