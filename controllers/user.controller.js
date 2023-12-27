/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import sellerModel from "../models/seller.model.js";
import asyncErrorHandler from "./asyncErrorHandler.js";
import CustomError from "../Middeleware/customError.js";
import joiMiddeleware from "../Middeleware/joyMiddeleware.js";
import organizationModel from "../models/organization.model.js";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

class UserController {
    static getUsers = async (req, res) => {
        try {
            const { name, limit = 10, page = 1, sortBy, role } = req.query;
            const query = {};
            query.deleted = false;
            if (name) {
                query.name = { $regex: new RegExp(name, "i") };
            }

            if (role) {
                query.role = { $regex: new RegExp(role, "i") };
            }

            const skip = (page - 1) * limit;
            let sortOptions = {};
            query.deleted = false;
            query._org = req.seller._org._id;
            const aggregationPipeline = [
                { $match: query },
                { $skip: skip },
                { $limit: parseInt(limit) },
                {
                    $addFields: {
                        _org: req.seller._org
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

            const productsArr = await sellerModel.aggregate(aggregationPipeline);

            const totalCount = await sellerModel.countDocuments(query);
            const totalPages = Math.ceil(totalCount / limit);
            res.status(200).json({
                results: productsArr,
                totalResults: totalCount,
                totalPages,
                page: parseInt(page),
                limit: parseInt(limit)
            });
        }
        catch (err) {
            return res.status(400).send({
                message: "Error Occurred While Fetching Products"
            });
        }
    };

    static updateCompanyInfo = asyncErrorHandler(async (req, res, next) => {
        await joiMiddeleware.updateCompanyInfo.validateAsync(req.body);
        try {
            await organizationModel.findByIdAndUpdate(req.seller._org, req.body);
            return res.send({
                message: "Company Information Updated Successfully"
            });
        }
        catch (err) {
            next(new CustomError("Please Provide Valid Mongodb Id", 400));
        }
    });

    static createUser = async (req, res) => {
        const { name, email, password, role } = req.body;
        const seller = await sellerModel.findOne({ email: email });
        if (seller) {
            let obj = {
                code: 400,
                message: "There is already an account with this email address",
                stack: "Error: There is already an account with this email address"
            };
            return res.status(400).send(obj);
        }
        else {
            if (name == "") {
                return res.status(400).send({
                    code: 400,
                    message: "\"name\" is not allowed to be empty",
                    stack: "Error: name is not allowed to be empty"
                });
            }
            else if (email == "") {
                return res.status(400).send({
                    code: 400,
                    message: "\"email\" is not allowed to be empty",
                    stack: "Error: email is not allowed to be empty"
                });
            }
            else if (password == "") {
                return res.status(400).send({
                    code: 400,
                    message: "\"Password\" is not allowed to be empty",
                    stack: "Error: password is not allowed to be empty"
                });
            }
            else if (role == "") {
                return res.status(400).send({
                    code: 400,
                    message: "\"Role\" is not allowed to be empty",
                    stack: "Error: Company Name is not allowed to be empty"
                });
            }
            else {
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashPassword = await bcrypt.hash(password, salt);
                    const doc = new sellerModel({
                        name: name,
                        _org: req.seller._org,
                        email: email,
                        password: hashPassword,
                        role: role,
                        isEmailVerified: false,
                        deleted: false
                    });
                    await doc.save();
                    let savedSeller = await sellerModel
                        .findOne({ email: email })
                        .select("-users")
                        .select("-password");

                    //Generating Token Here
                    const token = jwt.sign(
                        { sub: savedSeller._id, type: "access" },
                        process.env.JWT_SECRET_KEY,
                        { expiresIn: "1d" }
                    );
                    let expiryDate = "";
                    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                        if (err) {
                            // console.error("Token verification failed:", err);
                        }
                        else {
                            expiryDate = new Date(decoded.exp * 1000);
                        }
                    });

                    let obj = {
                        user: savedSeller,
                        token: token,
                        expires: expiryDate
                    };
                    return res.send(obj);
                }
                catch (err) {
                    return res.status(400).send({ message: "Error Occurrred" });
                }
            }
        }
    };

    static updateUserInfo = asyncErrorHandler(async (req, res, next) => {
        await joiMiddeleware.updteUserInfo.validateAsync(req.body);
        let userId = req.params.userId;
        try {
            let user = await sellerModel.findById(userId).select("-password");

            if (!Object.keys(req.body).length) {
                next(new CustomError("Please Provide Atleast One Key", 400));
            }

            if (req.body.email) {
                let allUsers = await sellerModel.findOne({ email: req.body.email });
                if (allUsers && user.email != allUsers.email) {
                    if (req.seller.email == allUsers.email) {
                        return next(
                            new CustomError("User Already Present With This Email", 400)
                        );
                    }
                    return next(
                        new CustomError("User Already Present With This Email", 400)
                    );
                }
            }

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                const hashPassword = await bcrypt.hash(req.body.password, salt);
                req.body.password = hashPassword;
            }

            await sellerModel.findByIdAndUpdate(userId, {
                $set: req.body
            });
            let updatedUser = await sellerModel.findById(userId).select("-password");
            return res.send(updatedUser);
        }
        catch (err) {
            // console.log(err);
            let errMsg = "Please Provide Valid UserId \n,";
            if (!Object.keys(req.body).length) {
                errMsg += " Please Provide Atleast One Key";
            }
            next(new CustomError(errMsg, 400));
        }
    });

    static updateUserRole = asyncErrorHandler(async (req, res, next) => {
        const { role } = req.body;
        await joiMiddeleware.updateUserRole.validateAsync(req.body);
        try {
            let userId = req.params.userId;
            let user = await sellerModel.findById(userId);
            await sellerModel.findByIdAndUpdate(user._id, {
                $set: {
                    role: role
                }
            });
            return res.send({ message: "User role Updated Successfully" });
        }
        catch (err) {
            next(new CustomError("Please Provide Valid UserId", 400));
        }
    });

    static deleteUser = async (req, res) => {
        let userId = req.params.userId;
        if (userId) {
            try {
                let user = await sellerModel.findById(userId);
                if (user == null || user == undefined) {
                    res.status(400).send({
                        code: 400,
                        message: "Please Provide Valid UserId",
                        stack: "Error: User does not Exist With This Id"
                    });
                }
                await sellerModel.findByIdAndUpdate(userId, {
                    $set: {
                        deleted: true
                    }
                });
                return res.send({ message: "User Deleted Successfully" });
            }
            catch (err) {
                return res.status(400).send({
                    code: 400,
                    message: "Please Provide Valid UserId",
                    stack: "Error: User does not Exist With This Id"
                });
            }
        }
        else {
            return res.status(400).send({
                code: 400,
                message: "Not a valid UserId",
                stack: "Please Provide valid UserId"
            });
        }
    };

    static searchProduct = async (req, res) => {
        res.send({ message: "Works" });
    };

    static updateCustomerProfilePicture = asyncErrorHandler(
        async (req, res, next) => {
            try {
                // res.set("Content-Type", "image/jpeg");
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
                    return res
                        .status(400)
                        .send({
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
                        const image = req.seller.picture.public_id;
                        if (image) {
                            await cloudinary.uploader.destroy(
                                image,
                                function (error, result) {
                                    console.log(result);
                                }
                            );
                        }

                        await sellerModel.findByIdAndUpdate(req.seller._id, {
                            $set: {
                                picture: uploadedImages[0]
                            }
                        });

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
                req.seller.picture.public_id == "Profile Picture/d8o8pwpp5hdtf9bnu4sh"
            ) {
                res.status(403).send({
                    message: "You Do Not Have Access To Delete Default Profile Picture"
                });
            }
            else {
                await cloudinary.uploader.destroy(
                    req.seller.picture.public_id,
                    function (error, result) {
                        console.log(result);
                    }
                );

                await sellerModel.findByIdAndUpdate(req.seller._id, {
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
}

export default UserController;
