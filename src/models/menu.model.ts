import mongoose, { Document } from "mongoose";

export interface IMenu {
  name: String;
  description: String;
  price: Number;
  image: String;
}

export interface IMenuDocument extends IMenu, Document {
  createdAt: Date;
  updatedAt: Date;
}

const menuSchema = new mongoose.Schema<IMenuDocument>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  }
}, { timestamps: true })

export const Menu = mongoose.model("Menu", menuSchema);