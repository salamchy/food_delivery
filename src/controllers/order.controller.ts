import { Request, Response } from "express";
import { Resturant } from "../models/resturant.model";
import { Order } from "../models/order.model";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.id }).populate('user').populate('resturant');
    return res.status(200).json({
      success: true,
      orders
    })
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Send a server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
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

    const menuItems = resturant.menus;
    const lineItems = createLineItems(checkOutSessionRequest, menuItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA']
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/order/status`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        orderId: order._id.toString(),
        images: JSON.stringify(menuItems.map((item: any) => item.image))
      }
    });
    if (!session.url) {
      res.status(400).json({
        success: false,
        message: "Error while creating session."
      })
      return;
    }
    await order.save();
    res.status(200).json({
      session

    })
    return;

  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Send a server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const createLineItems = (checkOutSessionRequest: checkOutSessionRequest, menuItems: any) => {
  const lineItems = checkOutSessionRequest.cartItems.map((cartItem) => {
    const menuItem = menuItems.find((item: any) =>
      item._id === cartItem.menuId
    );
    if (!menuItem) throw new Error(`Menu item id not found`);
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: menuItem.name,
          images: [menuItem.image]
        },
        unit_amount: menuItem.price
      },
      quantity: cartItem.quantity,
    }
  });
  return lineItems;
}