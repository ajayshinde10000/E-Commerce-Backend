import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import express from "express";
import cors from "cors";

import authRoutes from "./Routes/authRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import productRoutes from "./Routes/productsRoutes.js";
import shopUserRoutes from "./Routes/shopRoutes.js";
import shoopUserOrderRoutes from "./Routes/shopUserOrderRoutes.js";
import sellerOrderRoutes from "./Routes/sellerOrderRoutes.js";
import emailRoutes from "./Routes/emailRoutes.js";
import searchRoutes from "./Routes/SearchRoutes.js";
import {rateLimit} from "express-rate-limit";

import connectDb from "./Config/connectDB.js";

const limit = rateLimit({
    max:1000,
    windowMs: 60 * 60 *1000,
    message: "Too many request from this IP",
    headers: true
});

// eslint-disable-next-line no-undef
const PORT = process.env.PORT;
// eslint-disable-next-line no-undef
const DATABASE_URL = process.env.CLOUD_DATABASE_URL;

const app = express();
app.use(cors());

app.use(limit);

app.use(express.static("public"));

//connection to Database
connectDb(DATABASE_URL);

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use("/product-images", express.static("Product-Images"));

app.use("/auth",authRoutes);

app.use("/users",userRoutes);

app.use("/products/search",searchRoutes);

app.use("/products",productRoutes);

app.use("/shop",shopUserRoutes);

app.use("/shop/orders",shoopUserOrderRoutes);

app.use("/orders",sellerOrderRoutes);

app.use("/emails",emailRoutes);

//Hello Changes Here

app.listen(PORT,()=>{
    console.log("App Listening on 3000 port");
});