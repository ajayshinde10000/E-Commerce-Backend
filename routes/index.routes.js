import express from "express";

import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import productRoutes from "./products.routes.js";
import shopUserRoutes from "./shop.routes.js";
import shoopUserOrderRoutes from "./shop-user-order.routes.js";
import sellerOrderRoutes from "./seller-order.routes.js";
import emailRoutes from "./email.routes.js";
import searchRoutes from "./search.routes.js";
import ratingRoutes from "./rating.routes.js";
import sellerdashboardRoutes from "./seller-dashboard.routes.js";

const app = express.Router();

app.use("/product-images", express.static("Product-Images"));

app.use("/Profile-Picture-Images", express.static("Profile-Picture-Images"));

app.use("/auth",authRoutes);

app.use("/users",userRoutes);

app.use("/search/products",searchRoutes);

app.use("/products",productRoutes);

app.use("/shop",shopUserRoutes);

app.use("/shop/orders",shoopUserOrderRoutes);

app.use("/orders",sellerOrderRoutes);

app.use("/emails",emailRoutes);

app.use("/ratings",ratingRoutes);

app.use("/seller",sellerdashboardRoutes);

export default app;