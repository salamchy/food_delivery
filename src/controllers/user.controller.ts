import { Request, Response } from "express";
import { User } from "../models/user.model";
import Bcryptjs from "bcryptjs";

// Function to handle user signup
export const signup = async(req: Request, res: Response) => {
  try {
    // Destructure values from the request body (name, email, password, contact number)
    const { fullname, email, password, contact } = req.body;

    // Check if a user already exists with the provided email
    let user = await User.findOne({email});
    if (user) {
      // If user already exists, respond with a 400 status and error message
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    // Encrypt (hash) the user's password for security
    const hashedPassword = await Bcryptjs.hash(password, 10);

    // Generate a verification token (placeholder for now)
    const verificationToken = "kjfhosdhf"; // generateVerification() function can be implemented

    // Create a new user in the database with provided info, hashed password, and verification token
    user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      contact: Number(contact),
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 // token expires in 24 hours
    });

    // Optionally: generate an authentication token and send a verification email (functions not implemented here)
    // generateToken(req, user);
    // await sendVerificationEmail(email, verificationToken);

    // Find the user in the database without including the password field
    const userWithoutPassword = await User.findOne({email}).select("-password");

    // Respond with a success message and user information
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: userWithoutPassword
    });

  } catch (error) {
    // Log error to console and respond with a 500 status for server error
    console.log(error);
    return res.status(500).json({message: "Internal Server Error"});
  }
};

// Function to handle user login
export const login = async (req: Request, res: Response) => {
  try {
    // Destructure email and password from request body
    const { email, password } = req.body;

    // Look up user by email in the database
    const user = await User.findOne({ email });
    if (!user) {
      // If user not found, respond with 400 status and error message
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password"
      });
    }

    // Check if entered password matches the stored hashed password
    const isPasswordMatch = await Bcryptjs.compare(password, user.password);
    if (!isPasswordMatch) {
      // If password does not match, respond with an error
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password"
      });
    }

    // Optional: generate authentication token here (function not implemented)
    // generateToken(res, user);

    // Update user's last login date to current date
    user.lastLogin = new Date();
    await user.save();

    // Retrieve user information without the password
    const userWithoutPassword = await User.findOne({email}).select("-password");

    // Respond with a success message and user information
    return res.status(200).json({
      success: true,
      message: `Welcome back ${user.fullname}`,
      user: userWithoutPassword
    });

  } catch (error) {
    // Log error and respond with a 500 status for server error
    console.log(error);
    return res.status(500).json({message: "Internal Server Error"});
  }
};


// Function to handle email verification
export const verifyEmail = async(req: Request, res: Response) => {
  try {
    // Extract the verification code from the request body
    const { verificationCode } = req.body;

    // Find a user with a matching verification token that hasn't expired
    const user = await User.findOne({
      verificationToken: verificationCode,
      verificationTokenExpiresAt: { $gt: Date.now() } // token expiry check
    }).select("-password"); // exclude password from the response

    // If no user is found, the token is invalid or expired
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token"
      });
    }

    // Mark the user's account as verified
    user.isVerified = true;

    // Remove the verification token and its expiry date from the user record
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    // Save the updated user information to the database
    await user.save();

    // Optionally: send a welcome email to the user (function not implemented here)
    // await sendWelcomeEmail(user.email, user.fullname);

    // Respond with a success message and the user information
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user
    });

  } catch (error) {
    // Log the error and respond with a 500 status for server error
    console.log(error);
    return res.status(500).json({
      message: "Internal Server error"
    });
  }
};


// Function to handle user logout
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the authentication token cookie and send a success response
    return res.clearCookie("token").status(200).json({
      success: true,
      message: "Logged out successfully"
    });
    
  } catch (error) {
    // If an error occurs, log it to the console and respond with a 500 status for server error
    console.log(error);
    return res.status(500).json({
      message: "Internal Server error"
    });
  }
}
