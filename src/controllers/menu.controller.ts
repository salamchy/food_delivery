import { Request, Response } from "express";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { Menu } from "../models/menu.model";
import { Resturant } from "../models/resturant.model";
import mongoose from "mongoose";

export const addMenu = async (req: Request, res: Response) => {
  try {
    // Destructure the necessary data from the request body
    const { name, description, price } = req.body;

    // Access the uploaded file from the request
    const file = req.file;

    // Check if the file (image) is provided
    if (!file) {
      res.status(400).json({
        success: false,
        message: "Image is required", // Notify the client that an image is required
      });
      return; // Stop further execution if no file is provided
    }

    // Upload the image to a cloud storage service (e.g., Cloudinary)
    // `uploadImageOnCloudinary` is assumed to be a helper function that returns the uploaded image's URL
    const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);

    // Create a new menu item in the database using the provided data and uploaded image URL
    const menu = await Menu.create({
      name,
      description,
      price,
      image: imageUrl, // Save the URL of the uploaded image
    });

    // Find the restaurant associated with the current user (using their ID from the request)
    const resturant = await Resturant.findOne({ user: req.id });

    // If a restaurant is found, add the new menu item's ID to its `menus` field
    if (resturant) {
      // TypeScript requires explicit type assertion for `menus` and `menu._id` as ObjectId
      (resturant.menus as mongoose.Schema.Types.ObjectId[]).push(
        menu._id as mongoose.Schema.Types.ObjectId
      );

      // Save the updated restaurant document in the database
      await resturant.save();
    }

    // Respond with a success message and the newly created menu data
    return res.status(201).json({
      success: true,
      message: "Menu added successfully",
      menu, // Include the newly created menu in the response
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Respond with a 500 status code for any unexpected server errors
    res.status(500).json({ message: "Internal Server Error" });
  }
};
