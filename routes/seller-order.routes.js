import express from "express";
import sellerOrderController from "../controllers/seller-order.controller.js";
import checkAuth from "../Middeleware/authMiddeleware.js";

const router = express.Router();

router.use(checkAuth);

router.get("/",sellerOrderController.getOrders);
router.get("/:orderId",sellerOrderController.orderDetails);
router.patch("/:action/:orderId",sellerOrderController.changeAction);
router.get("/invoice/:orderId",sellerOrderController.generateInvoice);

export default router;