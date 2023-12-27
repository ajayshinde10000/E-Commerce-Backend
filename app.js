import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import compression from "compression";

import {rateLimit} from "express-rate-limit";
import CustomError from "./Middeleware/customError.js";
import globalErrorHandler  from "./controllers/error.controller.js";

import router from "./routes/index.routes.js";

import path from "path";
const __dirname = path.resolve();

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
const DATABASE_URL = process.env.DATABASE_URL;

const app = express();
app.use(cors());
app.use(compression());
app.use(limit);
app.use(express.static("public"));

//Setting up Pug
app.set(path.join(__dirname, "/views"));
app.set("view engine", "pug");

//connection to Database
connectDb(DATABASE_URL);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(router);

//Creating Gloabal Error Handler Here
app.all("*",(req,res,next)=>{
    const error = new CustomError("Not Found", 500);
    next(error);
});

app.use(globalErrorHandler);

app.listen(PORT,()=>{
    console.log("App Listening on 3000 port");
});