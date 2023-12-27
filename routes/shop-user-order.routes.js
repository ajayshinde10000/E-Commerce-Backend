import express from "express";
import userOrderController from "../controllers/user-order.controller.js";
import checkShopAuth from "../Middeleware/shopAuthMiddeleware.js";
const router = express.Router();

router.use(checkShopAuth);

// router.use("",checkShopAuth);
// router.use("/create-order",checkShopAuth);
// router.use("/confirm/:orderId",checkShopAuth);
// router.use("/:orderId",checkShopAuth);
// router.use("/cancel/:orderId",checkShopAuth);

router.get("/",userOrderController.getOrders);
router.post("/create-order",userOrderController.createOrder);
router.put("/confirm/:orderId",userOrderController.confirmOrder);


router.post("/process-payment",userOrderController.confirmOrderStripe);


router.get("/demo",userOrderController.getOrderDemo);

router.get("/:orderId",userOrderController.orderDetails);

router.patch("/cancel/:orderId",userOrderController.cancelOrder);

router.get("/invoice/:orderId",userOrderController.generateInvoice);

export default router;