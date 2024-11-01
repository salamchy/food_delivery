import mongoose from "mongoose";

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

}, {timestamps: true})