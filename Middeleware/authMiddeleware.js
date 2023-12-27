import jwt from "jsonwebtoken";
import sellerModel from "../models/seller.model.js";
import asyncErrorHandler from "../controllers/asyncErrorHandler.js";
import CustomError from "./customError.js";
import organizationModel from "../models/organization.model.js";

const checkAuth = asyncErrorHandler(async(req,res,next)=>{
    if(req.headers.authorization != undefined){
        let token = req.headers.authorization.split(" ")[1];
        // eslint-disable-next-line no-undef
        let result =jwt.verify(token, process.env.JWT_SECRET_KEY);
        result = result.sub;
        let seller = await sellerModel.findById(result).select("-password");

        if(!seller){
            return next(new CustomError("Please authenticate",401));
        }

        let org = await organizationModel.findById(seller._org).select("-createdAt").select("-updatedAt").select("-__v");
        seller._org=org;
        req.seller = seller;
        next();
    }
    else{
        next(new CustomError("Please authenticate",401));
    }
});

export default checkAuth;