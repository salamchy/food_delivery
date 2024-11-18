import { Request, Response } from "express";
import { Resturant } from "../models/resturant.model";
import { Order } from "../models/order.model";
import Stripe from "stripe";

// Import Stripe for handling payments
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // The `!` asserts that the environment variable is defined.

// Define the structure of the checkout session request
type checkOutSessionRequest = {
  cartItems: {
    menuId: string, // Unique ID of the menu item
    name: string, // Name of the menu item
    image: string, // Image URL of the menu item
    price: number, // Price of the menu item in smallest currency unit (e.g., cents)
    quantity: number // Quantity of the item added to the cart
  }[],

  deliveryDetails: {
    name: string, // Customer's name
    email: string, // Customer's email address
    address: string, // Delivery address
    city: string // City for delivery
  },

  resturantId: string // ID of the restaurant being ordered from
};

// Get all orders for a user
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch orders from the database where the `user` field matches the logged-in user's ID
    const orders = await Order.find({ user: req.id }) // `req.id` contains the user's ID from authentication middleware
      .populate('user') // Populate user details in the order response
      .populate('resturant'); // Populate restaurant details in the order response

    // Respond with the orders in JSON format
    res.status(200).json({
      success: true,
      orders, // The orders fetched from the database
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Internal Server Error" }); // Send a generic error response
  }
};

// Create a checkout session for a user's order
export const createCheckOutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const checkOutSessionRequest: checkOutSessionRequest = req.body; // Extract the request body containing cart and delivery details
    const resturant = await Resturant.findById(checkOutSessionRequest.resturantId).populate('menu'); // Find the restaurant and its menu items

    if (!resturant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found", // Error message if the restaurant ID is invalid
      });
      return; // Stop execution
    }

    // Create a new order instance but do not save it yet
    const order = new Order({
      resturant: resturant._id, // Associate the restaurant ID with the order
      user: req.id, // Associate the logged-in user ID with the order
      deliveryDetails: checkOutSessionRequest.deliveryDetails, // Save delivery details
      cartItems: checkOutSessionRequest.cartItems, // Save cart items in the order
      status: "pending", // Set the order status to pending
    });

    const menuItems = resturant.menus; // Get all menu items for the restaurant
    const lineItems = createLineItems(checkOutSessionRequest, menuItems); // Create line items for Stripe checkout

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Allow only card payments
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA'], // Restrict to specific countries
      },
      line_items: lineItems, // Pass the formatted line items
      mode: 'payment', // Set mode to one-time payment
      success_url: `${process.env.FRONTEND_URL}/order/status`, // Redirect here on success
      cancel_url: `${process.env.FRONTEND_URL}/cart`, // Redirect here on cancel
      metadata: {
        orderId: order._id.toString(), // Save order ID for reference
        images: JSON.stringify(menuItems.map((item: any) => item.image)), // Store images for display on success page
      },
    });

    if (!session.url) {
      res.status(400).json({
        success: false,
        message: "Error while creating session.", // Handle errors in session creation
      });
      return;
    }

    await order.save(); // Save the order to the database
    res.status(200).json({ session }); // Respond with the Stripe session
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Internal Server Error" }); // Send a generic error response
  }
};

// Create line items for Stripe checkout
export const createLineItems = (checkOutSessionRequest: checkOutSessionRequest, menuItems: any) => {
  // Map through the items in the user's cart and create corresponding line items for Stripe
  const lineItems = checkOutSessionRequest.cartItems.map((cartItem) => {
    // Find the matching menu item in the restaurant's menu
    const menuItem = menuItems.find((item: any) =>
      item._id === cartItem.menuId // Match menu ID
    );

    if (!menuItem) throw new Error(`Menu item id not found`); // Throw an error if the menu item is missing

    // Return a line item object in the format expected by Stripe
    return {
      price_data: {
        currency: 'usd', // Specify the currency
        product_data: {
          name: menuItem.name, // Set the product name
          images: [menuItem.image], // Attach an image
        },
        unit_amount: menuItem.price, // Specify the price in cents
      },
      quantity: cartItem.quantity, // Set the quantity
    };
  });

  return lineItems; // Return the array of line items
};
