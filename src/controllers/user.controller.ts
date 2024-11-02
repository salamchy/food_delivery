import { Request, Response } from "express";

export const signup = async(req:Request, res:Response) => {
  try {
    const { fullname, email, password, contact } = 
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: "Internal Server Error"})
    
  }
}