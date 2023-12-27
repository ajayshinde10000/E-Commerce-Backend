/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();

import shopUserModel from "../models/shop-user.model.js";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import productModel from "../models/product.model.js";
import joiMiddeleware from "../Middeleware/joyMiddeleware.js";
import asyncErrorHandler from "./asyncErrorHandler.js";
import CustomError from "../Middeleware/customError.js";
import ratingModule from "../models/ratings.model.js";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

class ShopUserController {
    static getUser = async (req, res) => {
        res.send("Get User Works");
    };

    static getProducts = async (req, res) => {
        try {
            const { name, limit = 10, page = 1, sortBy, category } = req.query;
            const query = {};
            if (name) {
                query.name = { $regex: new RegExp(name, "i") };
            }

            if (category) {
                let categoryArr = category.split(",") || [
                    "mobile",
                    "electronics",
                    "cloths",
                    "laptop",
                    "furniture"
                ];
                query.category = { $in: categoryArr };
            }

            const skip = (page - 1) * limit;
            let sortOptions = {};

            query.deleted = false;

            const currentTime = new Date();
            const aggregationPipeline = [
                { $match: query },
                { $skip: skip },
                { $limit: parseInt(limit) },
                {
                    $lookup: {
                        from: "deals",
                        let: { dealsIds: { $ifNull: ["$deals", []] } },
                        pipeline: [
                            { $match: { $expr: { $in: ["$_id", "$$dealsIds"] } } },
                            {
                                $addFields: {
                                    ends: { $dateFromString: { dateString: "$ends" } }
                                }
                            },
                            { $match: { ends: { $gt: currentTime } } },
                            {
                                $project: {
                                    _id: 1,
                                    createdAt: 0,
                                    updatedAt: 0,
                                    productId: 0,
                                    sellerId: 0
                                }
                            }
                        ],
                        as: "deals"
                    }
                }
            ];

            if (sortBy) {
                let sortOrder = 1;
                let sortParameter = sortBy;
                if (sortBy.includes("-")) {
                    sortParameter = sortBy.substring(1, sortBy.length);
                    sortOrder = -1;
                }
                sortOptions[sortParameter] = sortOrder;
                aggregationPipeline.unshift({ $sort: sortOptions });
            }

            const productsArr = await productModel.aggregate(aggregationPipeline);
            const totalCount = await productModel.countDocuments(query);
            const totalPages = Math.ceil(totalCount / limit);
            res.status(200).json({
                results: productsArr,
                totalResults: totalCount,
                totalPages,
                page: parseInt(page),
                limit: parseInt(limit)
            });
        }
        catch (error) {
            // console.error(error);
            res.status(500).json({ message: "Error fetching Products" });
        }
    };

    static updateCustomerProfile = async (req, res) => {
        const { name, email } = req.body;
        if (name == "" || name == undefined || name == null) {
            return res.status(400).send({
                code: 400,
                message: "Name Is Requires",
                stack: "Error: Please Provide Valid Name"
            });
        }
        else if (email == "" || email == undefined || email == null) {
            return res.status(400).send({
                code: 400,
                message: "Email Is Requires",
                stack: "Error: Please Provide Valid email"
            });
        }
        else {
            try {
                await shopUserModel.findByIdAndUpdate(req.shopUser._id, {
                    $set: {
                        email: email,
                        name: name
                    }
                });
                return res.send({ message: "Profile Updated Successfully" });
            }
            catch (err) {
                return res.status(400).send({
                    code: 400,
                    message: "Please Authenticate",
                    stack: "Error: Please Authenticate"
                });
            }
        }
    };

    static updateCustomerProfilePicture = asyncErrorHandler(
        async (req, res, next) => {
            try {
                const profilePicture = req.file;
                if (req.file.size > 2000000) {
                    return res
                        .status(400)
                        .send({ message: "File Size Greater Than 2mb is not allowed" });
                }

                let type = req.file.originalname.split(".")[1];
                if (
                    type != "jpg" &&
          type != "png" &&
          type != "webp" &&
          type != "jpeg"
                ) {
                    return res.status(400).send({
                        message: "Only jpg, png, webp and jpeg file type allowed"
                    });
                }

                let files = [];
                files[0] = profilePicture;
                let uploadedImages = [];

                const promises = files.map((file) => {
                    return new Promise((resolve, reject) => {
                        cloudinary.uploader
                            .upload_stream(
                                { resource_type: "auto", folder: "Profile Picture" },
                                (error, result) => {
                                    if (error) {
                                        //   console.error(error);
                                        reject("Upload failed");
                                    }
                                    else {
                                        uploadedImages.push({
                                            url: result.secure_url,
                                            public_id: result.public_id
                                        });
                                        resolve();
                                    }
                                }
                            )
                            .end(file.buffer);
                    });
                });

                Promise.all(promises)
                    .then(async () => {
                        const image = req.shopUser.picture.public_id;
                        if (image) {
                            await cloudinary.uploader.destroy(
                                image,
                                function (error, result) {
                                    console.log(result);
                                }
                            );
                        }

                        await shopUserModel.findByIdAndUpdate(
                            req.shopUser._id,
                            {
                                $set: {
                                    picture: uploadedImages[0]
                                }
                            }
                        );

                        await ratingModule.updateMany(
                            { userId: req.shopUser._id },
                            {
                                $set: {
                                    profilePicture: uploadedImages[0]
                                }
                            }
                        );
                        return res
                            .status(200)
                            .send({ message: "Profile Picture Updated Successfully" });
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).json({ error: "Upload failed" });
                    });
            }
            catch (err) {
                console.log(err);
                next(new CustomError("Image Not found", 400));
            }
        }
    );

    static deleteProfilePicture = asyncErrorHandler(async (req, res, next) => {
        try {
            if (
                req.shopUser.picture.public_id == "Profile Picture/d8o8pwpp5hdtf9bnu4sh"
            ) {
                res.status(403).send({
                    message: "You Do Not Have Access To Delete Default Profile Picture"
                });
            }
            else {
                await cloudinary.uploader.destroy(
                    req.shopUser.picture.public_id,
                    function (error, result) {
                        console.log(result);
                    }
                );

                await shopUserModel.findByIdAndUpdate(req.shopUser._id, {
                    $set: {
                        picture: {
                            public_id: "Profile Picture/d8o8pwpp5hdtf9bnu4sh",
                            url: "https://res.cloudinary.com/de94zb2cq/image/upload/v1695639919/Profile%20Picture/d8o8pwpp5hdtf9bnu4sh.png"
                        }
                    }
                });

                res.send({ message: "Profile Picture Deleted Successfully" });
            }
        }
        catch (err) {
            // console.log(err);
            next(new CustomError("Error Ocurred", 400));
        }
    });

    static getProfilePicture = async (req, res) => {
        try {
            let { userId } = req.params;
            const user = await shopUserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "Image not found" });
            }
            res.set("Content-Type", "image/jpeg");
            const picturePath = user.picture;
            res.sendFile(path.resolve(picturePath));
        }
        catch (error) {
            res.status(500).json({ error: "Failed to retrieve image" });
        }
    };

    static removeProfilePicture = async (req, res) => {
        try {
            // Find the product that contains the requested image
            const user = await shopUserModel.findById(req.shopUser._id);
            if (!user) {
                return res.status(404).json({ error: "Image not found" });
            }
            await shopUserModel.findByIdAndUpdate(user._id, {
                $set: {
                    picture: "Profile-Picture-Images/28ad22b01fb87e34f1fdf4014e2a0e3c"
                }
            });
            return res.send({ message: "Profile Image Deleted Successfully" });
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to retrieve image" });
        }
    };

    static getSavedAddresses = async (req, res) => {
        try {
            return res.send(req.shopUser.addresses);
        }
        catch (err) {
            return res.status(400).send({ message: "Error Occurred" });
        }
    };

    static addNewAddress = asyncErrorHandler(async (req, res, next) => {
        let { street, addressLine2, city, state, pin } = req.body;
        await joiMiddeleware.address.validateAsync(req.body);

        try {
            var newId = new mongoose.Types.ObjectId();
            let obj = {
                _id: newId,
                street: street,
                addressLine2: addressLine2,
                city: city,
                state: state,
                pin: pin
            };
            let user = await shopUserModel.findById(req.shopUser._id);
            let add = user.addresses;
            add.push(obj);
            await shopUserModel.findByIdAndUpdate(user._id, {
                $set: {
                    addresses: add
                }
            });
            return res.send(add);
        }
        catch (err) {
            //console.log(err)
            next(new CustomError("Error Ocuured", 400));
        }
    });

    static updateAddress = async (req, res) => {
        let { street, addressLine2, city, state, pin } = req.body;
        if (street == "" || street == undefined || street == null) {
            return res.status(400).send({
                code: 400,
                message: "Street is required",
                stack: "Error: Please Provide Street value"
            });
        }
        else if (
            addressLine2 == "" ||
      addressLine2 == undefined ||
      addressLine2 == null
        ) {
            return res.status(400).send({
                code: 400,
                message: "Address Line2 is required",
                stack: "Error: Please Provide Address Line2 value"
            });
        }
        else if (city == "" || city == undefined || city == null) {
            return res.status(400).send({
                code: 400,
                message: "City is required",
                stack: "Error: Please Provide City value"
            });
        }
        else if (state == "" || state == undefined || state == null) {
            return res.status(400).send({
                code: 400,
                message: "State is required",
                stack: "Error: Please Provide State value"
            });
        }
        else if (pin == "" || pin == undefined || pin == null) {
            return res.status(400).send({
                code: 400,
                message: "Pin is required",
                stack: "Error: Please Provide Valid pin"
            });
        }
        else {
            try {
                let add = req.shopUser.addresses;
                let newArr = [];
                for (let item of add) {
                    if (item._id == req.params.addressId) {
                        let obj = {
                            _id: item._id,
                            street: street,
                            addressLine2: addressLine2,
                            city: city,
                            state: state,
                            pin: pin
                        };
                        newArr.push(obj);
                    }
                    else {
                        newArr.push(item);
                    }
                }

                await shopUserModel.findByIdAndUpdate(req.shopUser._id, {
                    $set: {
                        addresses: newArr
                    }
                });
                return res.send({ message: "address Updated Successfully" });
            }
            catch (err) {
                //console.log(err)
                return res.status(400).send({
                    code: 400,
                    message: "Please Provide Valid Mongodb Id",
                    stack: "Error: Please Provide Valid Mongodb Id"
                });
            }
        }
    };

    static deleteAddress = async (req, res) => {
        try {
            let add = req.shopUser.addresses;
            let newArr = [];
            for (let item of add) {
                if (item._id != req.params.addressId) {
                    newArr.push(item);
                }
            }

            await shopUserModel.findByIdAndUpdate(req.shopUser._id, {
                $set: {
                    addresses: newArr
                }
            });
            return res.send({ message: "address Deleted Successfully" });
        }
        catch (err) {
            //console.log(err)
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Mongodb Id",
                stack: "Error: Please Provide Valid Mongodb Id"
            });
        }
    };

    static changePassword = async (req, res) => {
        const { old_password, new_password } = req.body;
        if (
            old_password == "" ||
      old_password == undefined ||
      old_password == null
        ) {
            return res.status(400).send({
                code: 400,
                message: "Old Password is required",
                stack: "Error: Please Provide Password"
            });
        }
        else if (
            new_password == "" ||
      new_password == undefined ||
      new_password == null
        ) {
            return res.status(400).send({
                code: 400,
                message: "Password is required",
                stack: "Error: Please Provide New Password"
            });
        }
        else {
            try {
                let shopUser = await shopUserModel.findById(req.shopUser._id);
                const isMatch = await bcrypt.compare(old_password, shopUser.password);
                if (isMatch) {
                    let salt = await bcrypt.genSalt(10);
                    let newHashPassword = await bcrypt.hash(new_password, salt);

                    await shopUserModel.findByIdAndUpdate(req.shopUser._id, {
                        $set: {
                            password: newHashPassword
                        }
                    });
                    return res.send({ message: "Password Changed Successfully" });
                }
                else {
                    return res.status(400).send({
                        code: 400,
                        message: "Old Password Does Not Match",
                        stack: "Error: Please Enter Corrrect Old Password"
                    });
                }
            }
            catch (err) {
                //console.log(err)
                return res.status(400).send({
                    code: 400,
                    message: "Please Authenticate",
                    stack: "Error: Please Authenticate"
                });
            }
        }
    };

    static deleteAccount = async (req, res) => {
        try {
            await shopUserModel.findByIdAndUpdate(req.shopUser._id, {
                $set: {
                    deleted: true
                }
            });
            return res.send({ message: "Account Deleted successfully" });
        }
        catch (err) {
            //console.log(err);
            return res.status(400).send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate"
            });
        }
    };

    static getProductDetails = async (req, res) => {
        try {
            let productId = req.params.productId;
            let currentDate = new Date();
            const pipeline = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(productId),
                        deleted: false
                    }
                },
                {
                    $lookup: {
                        from: "deals",
                        let: { dealIds: "$deals" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $in: ["$_id", "$$dealIds"] },
                                            { $gt: ["$ends", currentDate.toISOString()] }
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    ends: 1,
                                    discount: 1,
                                    _id: 1
                                }
                            }
                        ],
                        as: "validDeals"
                    }
                },
                {
                    $addFields: {
                        hasValidDeal: { $gt: [{ $size: "$validDeals" }, 0] }
                    }
                },
                {
                    $match: {
                        $or: [{ hasValidDeal: true }, { validDeals: { $size: 0 } }]
                    }
                },
                {
                    $project: {
                        name: 1,
                        description: 1,
                        images: 1,
                        price: 1,
                        _org: "$_org",
                        category: 1,
                        deals: "$validDeals",
                        stock:1
                    }
                }
            ];

            let product = await productModel.aggregate(pipeline);
            res.send(product[0]);
        }
        catch (err) {
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Product Id",
                stack: "Error: Please Provide Valid Product Id"
            });
        }
    };
}

export default ShopUserController;
