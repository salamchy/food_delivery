import { Request, Response } from "express";
import { Resturant } from "../models/resturant.model";
import { Order } from "../models/order.model";

type checkOutSessionRequest = {
  cartItems: {
    menuId: string,
    name: string,
    image: string,
    price: number,
    quantity: number
  }[],

  deliveryDetails: {
    name: string,
    email: string,
    address: string,
    city: string
  },

  resturantId: string
}

export const createCheckOutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const checkOutSessionRequest: checkOutSessionRequest = req.body;
    const resturant = await Resturant.findById(checkOutSessionRequest.resturantId).populate('menu')

    if (!resturant) {
      res.status(404).json({
        success: false,
        message: " Resturant not found"
      });
      return;
    };

    const order = new Order({
      resturant: resturant._id,
      user: req.id,
      deliveryDetails: checkOutSessionRequest.deliveryDetails,
      cartItems: checkOutSessionRequest.cartItems,
      status: "pending"
    });

  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Send a server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
}