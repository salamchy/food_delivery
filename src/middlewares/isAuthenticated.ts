import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Extend the Express Request interface to include a custom `id` property
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Middleware to check if the user is authenticated
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Retrieve the token from cookies
    const token = req.cookies.token;

    // If token is not present, respond with an "unauthorized" error
    if (!token) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Verify the token and decode its payload using the secret key
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as jwt.JwtPayload;

    // If the token is invalid, respond with an "unauthorized" error
    if (!decode) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    // Attach the decoded `userId` from the token to the `req` object for further use
    req.id = decode.userId;

    // Call the next middleware in the chain
    next();

  } catch (error) {
    // Handle any errors by responding with a "server error" message
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
