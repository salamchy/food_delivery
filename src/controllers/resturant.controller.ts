import { Request, Response } from "express";
import { Resturant } from "../models/resturant.model";
import { Multer } from "multer";
import uploadImageOnCloudinary from "../utils/imageUpload";

export const createResturant = async (req: Request, res: Response) => {
  try {
    const { resturantName, city, price, deliveryTime, cuisines } = req.body;
    const file = req.file;

    const resturant = await Resturant.findOne({ user: req.id });

    if (resturant) {
      return res.status(400).json({
        success: false,
        message: "Resturant already exist for this user"
      })
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image is Required"
      })
    }

    const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
    await Resturant.create({
      user: req.id,
      resturantName,
      city,
      deliveryTime,
      cuisines: JSON.parse(cuisines),
      imageUrl
    });
    return res.status(201).json({
      success: true,
      message: "Resturant Added"
    })

  } catch (error) {
    // Log any errors and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}