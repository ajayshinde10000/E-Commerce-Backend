import jwt from "jsonwebtoken";
import shopUserModel from "../models/shop-user.model.js";
import asyncErrorHandler from "../controllers/asyncErrorHandler.js";
import CustomError from "./customError.js";

const checkAuth = asyncErrorHandler(async(req,res,next)=>{
    if(req.headers.authorization != undefined){
        let token = req.headers.authorization.split(" ")[1];
        // eslint-disable-next-line no-undef
        let result = jwt.verify(token, process.env.JWT_SECRET_KEY);
        result = result.sub;
        let shopUser = await shopUserModel.findById(result).select("-password");
        if(!shopUser){
            next(new CustomError("Please authenticate",401));
        }
        req.shopUser = shopUser;
        next();
    }
    else{
        next(new CustomError("Please authenticate",401));
    }
});

export default checkAuth;