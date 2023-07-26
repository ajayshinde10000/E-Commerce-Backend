import express from "express";
import multer from "multer";
import shopUserController from "../Controllers/shopUserController.js";
import ShopAuthController from "../Controllers/shopAuth.js";
import checkShopAuth from "../Middeleware/shopAuthMiddeleware.js";
const router = express.Router();

const upload = multer({ dest: "Profile-Picture-Images/"});

router.use("/auth/self",checkShopAuth);
router.use("/customers/update-profile",checkShopAuth);
router.use("/customers/profile-picture",checkShopAuth);

//router.use('/profile-picture/:userId',checkShopAuth);

router.use("/customers/profile-picture",checkShopAuth);
router.use("/customers/address",checkShopAuth);
router.use("/customers/address",checkShopAuth);
router.use("/customers/address/:addressId",checkShopAuth);

router.use("/customers/auth/change-password",checkShopAuth);
router.use("/customers/account",checkShopAuth);

//public Apis
router.get("/products",shopUserController.getProducts);
router.get("/product/:productId",shopUserController.getProductDetails);
router.get("/",shopUserController.getUser);
router.post("/auth/register",ShopAuthController.register);
router.post("/auth/login",ShopAuthController.login);

router.post("/auth/login/google",ShopAuthController.loginWithGoogle);

router.post("/auth/forgot-password",ShopAuthController.userSendForgotPasswordLink);
router.post("/auth/reset-password",ShopAuthController.userResetPassword);


//private Apis
router.get("/auth/self",ShopAuthController.selfCall);
router.get("/profile-picture/:userId",shopUserController.getProfilePicture);
router.patch("/customers/update-profile",shopUserController.updateCustomerProfile);
router.post("/customers/profile-picture", upload.single("profilePicture"),shopUserController.updateCustomerProfilePicture);
router.delete("/customers/profile-picture",shopUserController.removeProfilePicture);
router.get("/customers/address",shopUserController.getSavedAddresses);
router.post("/customers/address",shopUserController.addNewAddress);

router.put("/customers/address/:addressId",shopUserController.updateAddress);
router.delete("/customers/address/:addressId",shopUserController.deleteAddress);
router.post("/customers/auth/change-password",shopUserController.changePassword);
router.delete("/customers/account",shopUserController.deleteAccount);


export default router;