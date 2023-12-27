import express from "express";
import SellerDashboardController from "../controllers/seller-dashboard.controller.js";
import authMidd from "../Middeleware/authMiddeleware.js";

const router = express.Router();
router.use(authMidd);

router.post("/dashboard",SellerDashboardController.getData);

export default router;