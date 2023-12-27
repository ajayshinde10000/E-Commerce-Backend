import express from "express";
import RatingController from "../controllers/rating.controller.js";
import shopAuthMiddeleware from "../Middeleware/shopAuthMiddeleware.js";

const router = express.Router();

router.get("/",RatingController.getAllRatings);
router.get("/:productId",RatingController.getReviews);

router.use(shopAuthMiddeleware);

router.get("/valid/:productId",RatingController.ValidUserToAddRating);
router.post("/add/:productId",RatingController.addRating);
router.put("/update/:ratingId",RatingController.updateRating);
router.delete("/:ratingId",RatingController.deleteRating);

export default router;