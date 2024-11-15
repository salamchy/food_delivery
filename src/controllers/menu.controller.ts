import { Request, Response } from "express";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { Menu } from "../models/menu.model";
import { Resturant } from "../models/resturant.model";
import mongoose from "mongoose";
import { log } from "console";

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

export const editMenu = async (req: Request, res: Response) => {
  try {
    // Extract the menu ID from the request parameters
    const { id } = req.params;

    // Extract the fields to update from the request body
    const { name, description, price } = req.body;

    // Access the uploaded file (if any) from the request
    const file = req.file;

    // Find the menu item in the database using the provided ID
    const menu = await Menu.findById(id);

    // If the menu item is not found, respond with a 404 (Not Found) status
    if (!menu) {
      res.status(404).json({
        success: false,
        message: "Menu not found", // Inform the client that the requested menu does not exist
      });
      return; // Stop further execution
    }

    // Update the menu fields only if they are provided in the request body
    if (name) menu.name = name; // Update the name if provided
    if (description) menu.description = description; // Update the description if provided
    if (price) menu.price = price; // Update the price if provided

    // If a new image file is uploaded, upload it to the cloud storage
    // and update the menu's image URL
    if (file) {
      const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
      menu.image = imageUrl; // Set the new image URL
    }

    // Save the updated menu item to the database
    await menu.save();

    // Respond with a success message and the updated menu item
    return res.status(200).json({
      success: true,
      message: "Menu Updated", // Inform the client that the menu was successfully updated
      menu, // Include the updated menu in the response
    });

  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Respond with a 500 status code for any unexpected server errors
    res.status(500).json({ message: "Internal Server Error" });
  }
};
