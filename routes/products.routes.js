import express from "express";
import checkAuth from "../Middeleware/authMiddeleware.js";
import productsController from "../controllers/products.controller.js";
import multer from "multer";


const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use("/",checkAuth);
// router.use("/:productId",checkAuth);

//Public Routes

//Private Routes
router.get("/",productsController.getProducts);
router.get("/images/:filename",productsController.getProductImage);
router.post("/",upload.array("images"),productsController.createProduct);
router.patch("/images/:productId",upload.array("images"),productsController.updateProductImages);
router.patch("/stock/:productId",productsController.editStock);
router.get("/:productId",productsController.getOneProduct);
router.patch("/:productId",productsController.updateProduct);
router.delete("/:productId",productsController.deleteProduct);

//Deal Routes
router.put("/deal",productsController.addDiscountByCategory);
router.patch("/deal/:productId",productsController.addDiscount);
router.delete("/deal/:dealId",productsController.deleteDiscount);

export default router;