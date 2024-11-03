import { Request, Response } from "express";
import { User } from "../models/user.model";
import Bcryptjs from "bcryptjs";

export const signup = async(req:Request, res:Response) => {
  try {
    const { fullname, email, password, contact } = req.body;

    let user = await User.findOne({email});
    if (user) {
      return res.status(400).json({success: false,
        message:"User already exist with this email"
      })
    }
    const hashedPassword = await Bcryptjs.hash(password, 10);

     const verificationToken = "kjfhosdhf"; //generateVerification();
    user = await User.create({
      fullname,
      email,
      password:hashedPassword,
      contact: Number(contact),
      verificationToken,
      verificationTokenExpiresAt: Date.now()+24*60*60*1000
    })

    //generateToken(req, user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: "Internal Server Error"})
    
  }
}