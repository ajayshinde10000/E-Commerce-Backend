import express from "express";
import checkAuth from "../Middeleware/authMiddeleware.js";
import userController from "../controllers/user.controller.js";
import multer from "multer";
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(checkAuth);

//Protected Routes
router.get("/",userController.getUsers);
router.patch("/org",userController.updateCompanyInfo);
router.post("/",userController.createUser);
router.patch("/:userId",userController.updateUserInfo);
router.patch("/role/:userId",userController.updateUserRole);
router.delete("/:userId",userController.deleteUser);


router.post("/profile-picture", upload.single("profilePicture"),userController.updateCustomerProfilePicture);
router.delete("/profile-picture",userController.deleteProfilePicture);


export default router;