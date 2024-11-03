import mongoose, { Document } from "mongoose";

type DeliveryDetails = {
  email: String;
  name: String;
  address: String;
  city: String;
}

type CartItems = {
  menuId: String;
  name: String;
  image: String;
  price: Number;
  quantity: Number;
}

export interface IOrder extends Document{
  user: mongoose.Schema.Types.ObjectId;
  resturant: mongoose.Schema.Types.ObjectId;
  deliveryDetails: DeliveryDetails;
  cartItems: CartItems;
  totalAmount: Number;
  status: "pending" | "confirmed" | "preparing" | "outForDelivery" | "delivered"
}


const orderSchema = new mongoose.Schema<IOrder>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  resturant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resturant",
    required: true
  },
  deliveryDetails: {
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
  },
  cartItems: [{
    menuId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    }
  }],
  totalAmount: Number,
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "outForDelivery", "delivered"],
    required: true
  }
}, {timestamps: true});

export const Order = mongoose.model("Order", orderSchema);