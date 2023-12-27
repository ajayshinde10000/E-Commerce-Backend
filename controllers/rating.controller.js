import CustomError from "../Middeleware/customError.js";
import joiMiddeleware from "../Middeleware/joyMiddeleware.js";
import asyncErrorHandler from "./asyncErrorHandler.js";
import ratingModule from "../models/ratings.model.js";
import orderModel from "../models/orders.model.js";
import mongoose from "mongoose";

class RatingController{
    static getAllRatings = async(req,res)=>{
        res.send("Rating Works");
    };

    static addRating = asyncErrorHandler(async(req,res,next)=>{
        try{
            const {productId} = req.params;
            await joiMiddeleware.addRating.validateAsync(req.body);
         
            let obj = {
                name:req.shopUser.name,
                profilePicture:req.shopUser.picture,
                email:req.shopUser.email,
                title:req.body.title,
                description:req.body.description,
                stars:req.body.stars,
                date:new Date().toISOString(),
                productId:productId,
                userId:req.shopUser._id,
                deleted:false
            };

            await new ratingModule(obj).save();
            return res.send({message: "Review Added Successfully"});
        }
        catch(err){
            // console.log(err);
            next(new CustomError(err.message,400));
        }
    });

    static updateRating = asyncErrorHandler(async(req,res,next)=>{
        try{
            const {ratingId} = req.params;
            await joiMiddeleware.updateRating.validateAsync(req.body);
            await ratingModule.findByIdAndUpdate(ratingId,{
                $set:req.body
            });
            return res.send({message:"Rating Updated Successfully"});
        }
        catch(err){
            // console.log(err);
            next(new CustomError(err.message,400));
        }
    });

    static getReviews = asyncErrorHandler(async(req,res,next)=>{
        try{
            const {productId} = req.params;
            let result = await ratingModule.find({productId:productId, deleted:false});
            let avgRating = 0;
            let myArr = [{"1":0},{"2":0},{"3":0},{"4":0},{"5":0}];

            for(let item of result){
                avgRating += item.stars;

                if(item.stars==1){
                    myArr[0]["1"]++;
                }
                else if(item.stars==2){
                    myArr[1]["2"]++;
                }
                else if(item.stars==3){
                    myArr[2]["3"]++;
                }
                else if(item.stars==4){
                    myArr[3]["4"]++;
                }
                else if(item.stars==5){
                    myArr[4]["5"]++;
                }

            }

            let obj = {
                result,
                avgRating: ((avgRating/(result.length*5))*5 || 0).toFixed(1),
                rating:myArr
            };
            res.send(obj);
        }
        catch(err){
            next(new CustomError(err.message,400));
        }
    });

    // eslint-disable-next-line no-unused-vars
    static deleteRating = asyncErrorHandler(async (req,res,next)=>{
        let {ratingId} = req.params;
        await ratingModule.findByIdAndUpdate(ratingId,{
            $set: {
                deleted: true
            }
        });
        res.send({message:"Rating Deleted Successfully"});
    });


    static ValidUserToAddRating = asyncErrorHandler(async (req,res,next)=>{
        try { 
            const {productId} = req.params;
            let rating = await orderModel.find({createdBy : new mongoose.Types.ObjectId(req.shopUser._id), "items.productId" : {$all : [new mongoose.Types.ObjectId(productId)]}});
            if(rating.length!=0){
                return res.status(200).send({message:"You Are Allowed To Rate This Product"});
            }
            else{
                next(new CustomError("You Have Not Buy This Product So You Are Not Allowed To Rate this Product",400));
            }

        }
        catch (error) {
            next(error);
        }
    });

}

export default RatingController;