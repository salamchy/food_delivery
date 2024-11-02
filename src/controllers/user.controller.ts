import { Request, Response } from "express";
import { User } from "../models/user.model";

export const signup = async(req:Request, res:Response) => {
  try {
    const { fullname, email, password, contact } = req.body;

    let user = await User.findOne({email});
    if (user) {
      return res.status(400).json({success: false,
        message:"User already exist"
      })
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: "Internal Server Error"})
    
  }
}