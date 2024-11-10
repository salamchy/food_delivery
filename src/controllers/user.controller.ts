import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcrypt from "bcryptjs";
import crypto from "crypto-js";
import cloudinary from "../utils/cloudinary";
import { generateVerificationCode } from "../utils/generateVerificationCode";
import { generateToken } from "../utils/generateToken";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerification, sendWelcomeEmail } from "../mailtrap/email";


// Handle user signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract necessary fields from the request body
    const { fullname, email, password, contact } = req.body;

    // Check if a user already exists with the provided email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists, respond with an error status and message
      res.status(400).json({ success: false, message: "User already exists with this email" });
      return;
    }

    // Hash the password for secure storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a verification token for email verification purposes
    const verificationToken = generateVerificationCode(6);

    // Create a new user in the database with hashed password and verification token
    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
      contact: parseInt(contact, 10) || 0, // Convert contact to integer (default to 0 if invalid)
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 // Set token expiry to 24 hours from now
    });

    // Generate an authentication token and set it in the response cookie
    generateToken(res, newUser);

    // Send a verification email with the generated token
    await sendVerification(email, verificationToken);

    // Retrieve the user data without the password field for response
    const userWithoutPassword = await User.findOne({ email }).select("-password");

    // Respond with a success message and user data
    res.status(201).json({ success: true, message: "Account created successfully", user: userWithoutPassword });

  } catch (error) {
    // Log any errors and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Handle user login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Check if the user exists with the provided email
    const user = await User.findOne({ email });

    // If user does not exist or password does not match, respond with an error
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).json({ success: false, message: "Incorrect email or password" });
      return;
    }

    // Generate a session token for the user and set it in the response cookie
    generateToken(res, user);

    // Update the user's last login date to the current date and save the record
    user.lastLogin = new Date();
    await user.save();

    // Retrieve the user data excluding the password field for response
    const userWithoutPassword = await User.findOne({ email }).select("-password");

    // Respond with a success message, greeting the user, and user data
    res.status(200).json({ success: true, message: `Welcome back ${user.fullname}`, user: userWithoutPassword });

  } catch (error) {
    // Log any errors to the console and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Handle email verification
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract the verification code from the request body
    const { verificationCode } = req.body;

    // Find a user with a matching verification token that hasn't expired
    const user = await User.findOne({
      verificationToken: verificationCode,
      verificationTokenExpiresAt: { $gt: Date.now() } // Check if token is still valid
    }).select("-password"); // Exclude password from the response

    // If no user is found, respond with an error indicating an invalid or expired token
    if (!user) {
      res.status(400).json({ success: false, message: "Invalid or expired verification token" });
      return;
    }

    // Mark the user's account as verified and remove the verification token and expiry date
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    // Optionally, send a welcome email to the user after successful verification
    await sendWelcomeEmail(user.email, user.fullname);

    // Respond with a success message and user data
    res.status(200).json({ success: true, message: "Email verified successfully", user });

  } catch (error) {
    // Log any errors to the console and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
};


// Handle user logout
export const logout = async (_: Request, res: Response): Promise<void> => {
  try {
    // Clear the authentication token cookie and respond with a success message
    res.clearCookie("token").status(200).json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    // Log any errors to the console and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
};


// Handle forgot password requests
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Retrieve the email from the request body
    const { email } = req.body;

    // Step 2: Check if a user with the provided email exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      // If no user is found, respond with a 400 status and an error message
      res.status(400).json({ success: false, message: "User doesn't exist" });
      return;
    }

    // Step 3: Generate a unique reset token and set its expiration time to 1 hour
    const resetToken = crypto.randomBytes(40).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // Token expires in 1 hour

    // Step 4: Save the reset token and its expiration time in the user’s record
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = resetTokenExpiresAt;
    await user.save();

    // Step 5: Send the password reset link to the user's email
    await sendPasswordResetEmail(user.email, `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`);

    // Step 6: Respond with a success message indicating that the reset link has been sent
    res.status(200).json({ success: true, message: "Password reset link sent to your email." });

  } catch (error) {
    // Log any errors to the console and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
};


// Handle password reset
// Function to handle password reset requests
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Retrieve the reset token from the request parameters and the new password from the request body
    const { token } = req.params;
    const { newPassword } = req.body;

    // Step 2: Find the user by the provided reset token and check if the token is still valid (not expired)
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiresAt: { $gt: Date.now() } // Token should not be expired
    });

    // Step 3: If no user is found or the token is invalid/expired, send a 400 error
    if (!user) {
      res.status(400).json({ success: false, message: "Invalid or expired reset token" });
      return;
    }

    // Step 4: Hash the new password and update the user's password
    user.password = await bcrypt.hash(newPassword, 10);

    // Step 5: Clear the reset token and its expiration time to prevent reuse
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;

    // Step 6: Save the updated user record to the database
    await user.save();

    // Step 7: Send an email notification indicating the password has been successfully reset
    await sendResetSuccessEmail(user.email);

    // Step 8: Respond with a success message indicating that the password was reset successfully
    res.status(200).json({ success: true, message: "Password reset successfully." });

  } catch (error) {
    // Log any errors to the console and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
};


// Check if user is authenticated
// Function to check if the user is authenticated and retrieve user details
export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Retrieve the user ID from the authenticated request (set by the isAuthenticated middleware)
    const userId = req.id;

    // Step 2: Find the user in the database by the ID, excluding the password field
    const user = await User.findById(userId).select("-password");

    // Step 3: If no user is found, send a 404 response indicating the user doesn't exist
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Step 4: If user is found, send a 200 response with the user details (excluding password)
    res.status(200).json({ success: true, user });

  } catch (error) {
    // Step 5: Log any errors to the console and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
};


// Handle user profile update
// Function to update the user's profile information
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Retrieve the user ID from the authenticated request (set by the isAuthenticated middleware)
    const userId = req.id;

    // Step 2: Destructure updated data (fullname, email, address, city, profilePicture) from the request body
    const { fullname, email, address, city, profilePicture } = req.body;

    // Step 3: Upload the profile picture to Cloudinary and retrieve the secure URL
    const cloudResponse = await cloudinary.uploader.upload(profilePicture);

    // Step 4: Create an updatedData object containing the new user information (profilePicture URL is from Cloudinary)
    const updatedData = {
      fullname,
      email,
      address,
      city,
      profilePicture: cloudResponse.secure_url
    };

    // Step 5: Update the user's profile information in the database using the userId
    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select("-password");

    // Step 6: Send a success response with the updated user data (excluding password)
    res.status(200).json({ success: true, user, message: "Profile updated successfully." });

  } catch (error) {
    // Step 7: Log any errors to the console and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
};
