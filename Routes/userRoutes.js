import express from "express";
import checkAuth from "../Middeleware/authMiddeleware.js";
import userController from "../Controllers/userController.js";

const router = express.Router();

router.use("/",checkAuth);
router.use("/org",checkAuth);
router.use("/:userId",checkAuth);
router.use("/role/:userId",checkAuth);

//public Routes

//Protected Routes
router.get("/",userController.getUsers);
router.patch("/org",userController.updateCompanyInfo);
router.post("/",userController.createUser);
router.patch("/:userId",userController.updateUserInfo);
router.patch("/role/:userId",userController.updateUserRole);
router.delete("/:userId",userController.deleteUser);


export default router;