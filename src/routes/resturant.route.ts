import express from "express";
import { createResturant, getResturant, getResturantOrder, getSingleResturant, searchResturant, updateOrderStatus, updateResturant } from "../controllers/resturant.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import upload from "../middlewares/multer";

const router = express.Router();

router.route("/").post(isAuthenticated, upload.single("imageFile"), createResturant);
router.route("/").get(isAuthenticated, getResturant);
router.route("/").put(isAuthenticated, upload.single("imageFile"), updateResturant);
router.route("/order").get(isAuthenticated, getResturantOrder);
router.route("/order/:orderId/status").put(isAuthenticated, updateOrderStatus);
router.route("/search/:searchText").get(isAuthenticated, searchResturant);
router.route("/:id").get(isAuthenticated, getSingleResturant);

export default router;