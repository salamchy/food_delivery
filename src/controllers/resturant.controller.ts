import { Request, Response } from "express";
import { Resturant } from "../models/resturant.model";
import { Multer } from "multer";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { Order } from "../models/order.model";

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

export const getResturant = async (req: Request, res: Response) => {
  try {
    const resturant = await Resturant.find({ user: req.id });
    if (!resturant) {
      return res.status(404).json({
        success: false,
        message: "Resturant not found"
      });
    }
    return res.status(200).json({ success: true, resturant })

  } catch (error) {
    // Log any errors and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const updateResturant = async (req: Request, res: Response) => {
  try {
    const { resturantName, city, deliveryTime, cuisines } = req.body;
    const file = req.file;
    const resturant = await Resturant.findOne({ user: req.id });
    if (!resturant) {
      return res.status(404).json({
        success: false,
        message: " Resturant not found"
      })
    }
    resturant.resturantName = resturantName;
    resturant.city = city;
    resturant.deliveryTime = deliveryTime;
    resturant.cuisines = JSON.parse(cuisines);

    if (file) {
      const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
      resturant.imageUrl = imageUrl;
    }
    await resturant.save();
    return res.status(200).json({
      success: true,
      message: "Resturant updated",
      resturant
    })

  } catch (error) {
    // Log any errors and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const getResturantOrder = async (req: Request, res: Response) => {
  try {
    const resturant = await Resturant.findOne({ user: req.id });
    if (!resturant) {
      return res.status(404).json({
        success: false,
        message: "Resturant not found"
      });
    };
    const orders = await Order.find({ resturant: resturant._id }).populate('resturant').populate('user');
    return res.status(200).json({
      success: true,
      orders
    });

  } catch (error) {
    // Log any errors and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    };

    order.status = status;
    await order.save();
    return res.status(200).json({
      success: true,
      message: "Status updated"
    });

  } catch (error) {
    // Log any errors and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const searchResturant = async (req: Request, res: Response) => {
  try {
    const searchText = req.params.searchText || "";
    const searchQuery = req.query.searchQuery as string || "";
    const selectedCuisines = (req.query.selectedCuisines as string || "").split(",").filter(cuisine => cuisine);
    const query: any = {};

    if (searchText) {
      query.$or = [
        { resturantName: { $regex: searchText, $options: 'i' } },
        { city: { $regx: searchText, $options: 'i' } },
      ]
    }

    if (searchQuery) {
      query.$or = [
        { resturantName: { $regex: searchText, $options: 'i' } },
        { cuisines: { $regx: searchQuery, $options: 'i' } },
      ]
    }

    if (selectedCuisines.length > 0) {
      query.cuisines = { $in: selectedCuisines }
    }

    const resturants = await Resturant.find(query)
    return res.status(200).json({
      success: true,
      data: resturants
    })

  } catch (error) {
    // Log any errors and respond with a 500 status for server error
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
}