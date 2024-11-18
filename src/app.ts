import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.route";
import resturantRouter from "./routes/resturant.route";
import menuRouter from "./routes/menu.route";
import orderRouter from "./routes/order.route";
import bodyParser from "body-parser"

// Create an instance of an Express application
const app = express();

// Enable CORS with specific options
// - origin: allows requests from the specified origin, which is set via environment variable
// - credentials: allows cookies to be included in cross-origin requests
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

//body parser
app.use(bodyParser.json({ limit: '10mb' }));

// Parse incoming JSON requests with a body size limit of 16kb
app.use(express.json({ limit: "10mb" }));

// Parse incoming URL-encoded data with a body size limit of 16kb
// - extended: true allows for rich objects and arrays to be encoded into the URL-encoded format
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from the "public" directory
app.use(express.static("public"));

// Parse cookies from incoming requests and populate req.cookies
app.use(cookieParser());

//api
app.use("/api/v1/user", userRouter);
app.use("/api/v1/resturant", resturantRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/order", orderRouter);