import express from "express";
import userOrderController from "../Controllers/userOrderController.js";
import checkShopAuth from "../Middeleware/shopAuthMiddeleware.js";
const router = express.Router();

router.use("",checkShopAuth);
router.use("/create-order",checkShopAuth);
router.use("/confirm/:orderId",checkShopAuth);
router.use("/:orderId",checkShopAuth);
router.use("/cancel/:orderId",checkShopAuth);

router.get("/",userOrderController.getOrders);
router.post("/create-order",userOrderController.createOrder);
router.put("/confirm/:orderId",userOrderController.confirmOrder);

router.get("/:orderId",userOrderController.orderDetails);

router.patch("/cancel/:orderId",userOrderController.cancelOrder);

export default router;