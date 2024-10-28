import dotenv from "dotenv";
import connectDB from "./db/index.ts";
import { application } from "express";

// Load environment variables from .env file
dotenv.config();

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the MongoDB database
    await connectDB();

    // Define the port to run the server on, either from the environment variables or default to 4000
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

    // Start the server and listen on the specified port
    application.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  } catch (err) {
    // Log an error message if the database connection fails
    console.error("MONGO DB connection failed !!!", err);
  }
};

// Call the function to start the server
startServer();