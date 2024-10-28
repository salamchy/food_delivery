import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// Create an instance of an Express application
const application = express();

// Enable CORS with specific options
// - origin: allows requests from the specified origin, which is set via environment variable
// - credentials: allows cookies to be included in cross-origin requests
application.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Parse incoming JSON requests with a body size limit of 16kb
application.use(express.json({ limit: "16kb" }));

// Parse incoming URL-encoded data with a body size limit of 16kb
// - extended: true allows for rich objects and arrays to be encoded into the URL-encoded format
application.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files from the "public" directory
application.use(express.static("public"));

// Parse cookies from incoming requests and populate req.cookies
application.use(cookieParser());