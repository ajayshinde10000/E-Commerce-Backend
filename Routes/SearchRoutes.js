import express from "express";
import searchController from "../Controllers/searchController.js";

const router = express.Router();

router.get("/",searchController.searchProduct);

export default router;