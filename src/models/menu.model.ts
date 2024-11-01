import mongoose from "mongoose";

export interface IMenu {
  _id: mongoose.Schema.Types.ObjectId;
  name: String;
  description: String;
  price: Number;
  image: String;
}

export interface IMenuDocument extends IMenu, Document {
  createdAt: Date;
  updatedAt: Date;
}

const menuSchema = new mongoose.Schema({
  
})