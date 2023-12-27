import express from "express";
import searchController from "../controllers/search.controller.js";

const router = express.Router();
router.get("/",searchController.searchProduct);
router.get("/get",searchController.getProductsFromDeal);
router.get("/",searchController.getProductByCategory);

export default router;