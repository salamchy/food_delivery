import { Request, Response } from "express";

export const createCheckOutSession = async (req: Request, res: Response): Promise<void> => {
  try {


  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Send a server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
}