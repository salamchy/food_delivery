import { Request, RequestHandler, Response } from "express";
import { Resturant } from "../models/resturant.model";
import { Multer } from "multer";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { Order } from "../models/order.model";

// Handler to Create a New Restaurant
export const createResturant: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract restaurant details from the request body
    const { resturantName, city, deliveryTime, cuisines } = req.body;
    const file = req.file; // Get the uploaded image file, if available

    // Check if a restaurant already exists for the current user
    const existingResturant = await Resturant.findOne({ user: req.id });
    if (existingResturant) {
      // If a restaurant already exists, send a 400 status with an error message
      res.status(400).json({
        success: false,
        message: "Restaurant already exists for this user",
      });
      return;
    }

    // Validate that an image file is provided
    if (!file) {
      res.status(400).json({
        success: false,
        message: "Image is required",
      });
      return;
    }

    // Upload the image to Cloudinary (or another storage service)
    const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);

    // Create a new restaurant entry in the database with the provided data
    await Resturant.create({
      user: req.id, // Associate the restaurant with the current user
      resturantName,
      city,
      deliveryTime,
      cuisines: JSON.parse(cuisines), // Parse cuisines from JSON string to array
      imageUrl, // Save the image URL from Cloudinary
    });

    // Send a success response with a 201 status when the restaurant is created
    res.status(201).json({
      success: true,
      message: "Restaurant added",
    });
  } catch (error) {
    // Log any errors to the console for debugging
    console.error(error);
    // Send a 500 status if an internal server error occurs
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Handler to Get a Restaurant for the Current User
export const getResturant: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find the restaurant that belongs to the current user
    const resturant = await Resturant.find({ user: req.id });

    // If no restaurant is found, send a 404 status with an error message
    if (!resturant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
      return;
    }

    // Send a success response with the restaurant details
    res.status(200).json({ success: true, resturant });
  } catch (error) {
    // Log any errors to the console
    console.error(error);
    // Send a 500 status if an internal server error occurs
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Restaurant Handler
// This function updates an existing restaurant's details.
export const updateResturant: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Destructure the data sent in the request body
    const { resturantName, city, deliveryTime, cuisines } = req.body;
    const file = req.file;

    // Check if the restaurant exists for the given user
    const resturant = await Resturant.findOne({ user: req.id });
    if (!resturant) {
      // Send a 404 error if the restaurant is not found
      res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
      return;
    }

    // Update restaurant fields with new data
    resturant.resturantName = resturantName;
    resturant.city = city;
    resturant.deliveryTime = deliveryTime;
    resturant.cuisines = JSON.parse(cuisines);

    // If a new image file is provided, update the restaurant image URL
    if (file) {
      const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
      resturant.imageUrl = imageUrl;
    }

    // Save the updated restaurant data
    await resturant.save();

    // Send a success response with the updated restaurant details
    res.status(200).json({
      success: true,
      message: "Restaurant updated",
      resturant
    });

  } catch (error) {
    // Log the error and respond with a 500 status if an internal server error occurs
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Restaurant Orders Handler
// This function retrieves all orders for a specific restaurant.
export const getResturantOrder: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find the restaurant for the current user
    const resturant = await Resturant.findOne({ user: req.id });
    if (!resturant) {
      // If restaurant not found, send a 404 error
      res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
      return;
    }

    // Find all orders associated with the restaurant
    const orders = await Order.find({ resturant: resturant._id }).populate('resturant').populate('user');
    res.status(200).json({
      success: true,
      orders
    });

  } catch (error) {
    // Handle any errors with a 500 status response
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Order Status Handler
// This function updates the status of a specific order.
export const updateOrderStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Find the order by its ID
    const order = await Order.findById(orderId);
    if (!order) {
      // Send a 404 error if the order is not found
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
      return;
    }

    // Update the order status and save the changes
    order.status = status;
    await order.save();

    // Send a success response indicating the status has been updated
    res.status(200).json({
      success: true,
      message: "Status updated"
    });

  } catch (error) {
    // Log any errors and respond with a 500 status if something goes wrong
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Search Restaurant Handler
// This function searches for restaurants based on various criteria.
export const searchResturant: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchText = req.params.searchText || "";
    const searchQuery = req.query.searchQuery as string || "";
    const selectedCuisines = (req.query.selectedCuisines as string || "").split(",").filter(cuisine => cuisine);

    // Create a query object for searching restaurants
    const query: any = {};

    // Search by text in restaurant name or city
    if (searchText) {
      query.$or = [
        { resturantName: { $regex: searchText, $options: 'i' } },
        { city: { $regex: searchText, $options: 'i' } },
      ];
    }

    // Search by additional query or cuisines
    if (searchQuery) {
      query.$or = [
        { resturantName: { $regex: searchQuery, $options: 'i' } },
        { cuisines: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // Filter by selected cuisines if provided
    if (selectedCuisines.length > 0) {
      query.cuisines = { $in: selectedCuisines };
    }

    // Find restaurants matching the query
    const resturants = await Resturant.find(query);

    // Send a success response with the found restaurants
    res.status(200).json({
      success: true,
      data: resturants
    });

  } catch (error) {
    // Handle any errors with a 500 response
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Single Restaurant Handler
// This function retrieves details of a single restaurant by its ID.
export const getSingleResturant: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const resturantId = req.params.id;

    // Find the restaurant by ID and populate its menu items
    const resturant = await Resturant.findById(resturantId).populate({
      path: 'Menus',
      options: { sort: { created: -1 } }  // Sort menu items by creation date
    });

    if (!resturant) {
      // Send a 404 response if the restaurant is not found
      res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
      return;
    }

    // Send a success response with the restaurant details
    res.status(200).json(resturant);

  } catch (error) {
    // Handle any errors with a 500 response
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
