/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();
import asyncErrorHandler from "./asyncErrorHandler.js";
import CustomError from "../Middeleware/customError.js";
// eslint-disable-next-line no-unused-vars
const upload = multer({ dest: "Product-Images/" });
import productsModel from "../models/product.model.js";
import fs from "fs";
import path from "path";
import joiModdeleware from "../Middeleware/joyMiddeleware.js";
import dealModal from "../models/deals.model.js";
// const mongoose = require('mongoose')
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

class ProductsController {
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
            query["sellerId"] = req.seller._id;

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

            const productsArr = await productsModel.aggregate(aggregationPipeline);

            const totalCount = await productsModel.countDocuments(query);
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
            console.error(error);
            res.status(500).json({ message: "Error fetching Products" });
        }
    };

    static getOneProduct = async (req, res) => {
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
                                    _id: 1,
                                    deleted: 1
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

            let product = await productsModel.aggregate(pipeline);
            let newProduct = product[0];
            newProduct.deals = newProduct.deals.filter((data) => {
                return !data.deleted;
            });
            res.send(newProduct);
        }
        catch (err) {
            // console.log(err);
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Product Id",
                stack: "Error: Please Provide Valid Product Id"
            });
        }
    };

    static createProduct = asyncErrorHandler(async (req, res, next) => {
        try {
            let files = req.files;
            const { name, description, price, category } = req.body;
            const _org = req.seller._org;
            await joiModdeleware.createProduct.validateAsync({
                name,
                description,
                price,
                category
            });

            let uploadedImages = [];

            const promises = files.map((file) => {
                return new Promise((resolve, reject) => {
                    cloudinary.uploader
                        .upload_stream(
                            { resource_type: "auto", folder: "Product Images" },
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
                    // Return the Cloudinary URLs of the uploaded images
                    const product = new productsModel({
                        name,
                        description,
                        price,
                        category,
                        _org,
                        images: uploadedImages,
                        sellerId: req.seller._id
                    });
                    const savedProduct = await product.save();
                    return res.json({
                        product: savedProduct
                    });
                })
                .catch((error) => {
                    //   console.error(error);
                    res.status(500).json({ error: "Upload failed" });
                });
        }
        catch (err) {
            //   console.log(err);
            next(new CustomError("Unable To Add Product", 400));
        }
    });

    static updateProduct = asyncErrorHandler(async (req, res, next) => {
        await joiModdeleware.createProduct.validateAsync(req.body);
        let productId = req.params.productId;
        try {
            await productsModel.findByIdAndUpdate(productId, {
                $set: req.body
            });
            return res.send({ message: "Product Updated Successfully" });
        }
        catch (err) {
            next(new CustomError("Please Provide Valid Product Id", 400));
        }
    });

    // eslint-disable-next-line no-unused-vars
    static deleteProductImages = async (req, res) => {
    //   const product = await getOneProduct(productId);
    // if (!product) {
    //   throw new ApiError('No Product match with given id', 400);
    // }
    // if (deleteImages) {
    //   deleteImages.forEach((image) => {
    //     const index = product.image.indexOf(image);
    //     if (index !== -1) {
    //       fs.unlinkSync(path.join(`${process.cwd()}/${image}`));
    //       product.image.splice(index, 1); // Remove the image at the specified index
    //     }
    //   });
    // }
    // if (images) {
    //   images.forEach((file) => {
    //     product.image.push(file.path);
    //   });
    // }
    // await product.save();
    // return product
    };

    static deleteProduct = async (req, res) => {
        try {
            let productId = req.params.productId;
            await productsModel.findByIdAndUpdate(productId, {
                $set: { deleted: true }
            });
            return res.send({ message: "Product Deleted Successfully" });
        }
        catch (err) {
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Product Id",
                stack: "Error: Please Provide Valid Product Id"
            });
        }
    };

    static getProductImage = asyncErrorHandler(async (req, res, next) => {
        const { filename } = req.params;
        try {
            // Find the product that contains the requested image
            const product = await productsModel.findOne({ images: filename });

            if (!product) {
                return res.status(404).json({ error: "Image not found" });
            }

            // Construct the file path based on your image storage location
            const filePath = path.join("Product-Images", filename);

            // Read the image file
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    //console.error(err);
                    return res.status(500).json({ error: "Failed to read image file" });
                }

                // Set the appropriate response headers
                res.setHeader("Content-Type", "image/png"); // Adjust the content type based on your image format
                return res.send(data);
            });
        }
        catch (error) {
            next(new CustomError("Failed to retrieve image", 400));
        }
    });

    static updateProductImages = async (req, res) => {
        try {
            const { productId } = req.params;
            const product = await productsModel.findById(productId);
            const files = req.files || [];

            const uploadedImages = [];
            let deleteArr = req.body.delete || [];

            if (typeof deleteArr == "string") {
                deleteArr = [deleteArr];
            }

            if (!this.deleteImages(deleteArr)) {
                return res.status(400).send({ message: "Error Occurred" });
            }

            // Upload each image to Cloudinary
            const promises = files.map((file) => {
                return new Promise((resolve, reject) => {
                    cloudinary.uploader
                        .upload_stream(
                            { resource_type: "auto", folder: "Product Images" },
                            async (error, result) => {
                                if (error) {
                                    console.error(error);
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
                    // Return the Cloudinary URLs of the uploaded images

                    let arr = [];
                    for (let item of product.images) {
                        console.log(item);
                        if (!deleteArr.includes(item.public_id)) {
                            arr.push(item);
                        }
                    }

                    for (let item of uploadedImages) {
                        arr.push(item);
                    }

                    await productsModel.findByIdAndUpdate(productId, {
                        $set: {
                            images: arr
                        }
                    });

                    return res
                        .status(200)
                        .json({
                            message: "Images Updated Successfully",
                            image: uploadedImages
                        });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json({ error: "Upload failed" });
                });
        }
        catch (error) {
            console.log(error);
            res.status(400).send(error.message);
        }
    };

    static deleteImages = async (imagesArr) => {
        try {
            for (let image of imagesArr) {
                await cloudinary.uploader.destroy(image, function (error, result) {
                    console.log(result);
                });
            }
            return true;
        }
        catch (error) {
            return false;
        }
    };

    //   static deleteProductImage = async (req, res) => {
    //     const { filename } = req.params;
    //     try {
    //       const product = await productsModel.findOne({ images: filename });
    //       if (!product) {
    //         return res.status(404).json({ error: "Image not found" });
    //       }
    //       const imageIndex = product.images.indexOf(filename);
    //       if (imageIndex > -1) {
    //         product.images.splice(imageIndex, 1);
    //         await product.save();
    //       }
    //       const filePath = path.join("Product-Images", filename);
    //       fs.unlinkSync(filePath);
    //       res.json({ message: "Image deleted successfully" });
    //     } catch (error) {
    //       res.status(500).json({ error: "Failed to delete image" });
    //     }
    //   };

    //   static updateProductImages = async (req, res) => {
    //     try {
    //       const { productId } = req.params;
    //       const product = await productsModel.findById(productId);

    //       if (req.body.delete) {
    //         if (typeof req.body.delete == "string") {
    //           const index = product.images.indexOf(req.body.delete);
    //           if (index !== -1) {
    //             fs.unlinkSync(path.join(`${process.cwd()}/${req.body.delete}`));
    //             product.images.splice(index, 1);
    //           }
    //         } else {
    //           req.body.delete.forEach((image) => {
    //             const index = product.images.indexOf(image);
    //             if (index !== -1) {
    //               fs.unlinkSync(path.join(`${process.cwd()}/${image}`));
    //               product.images.splice(index, 1);
    //             }
    //           });
    //         }
    //       }
    //       if (!product) {
    //         return res.status(404).json({ error: "Product not found" });
    //       }

    //       const uploadedImages = req.files.map((file) => file.path);
    //       if (uploadedImages.length > 0) {
    //         product.images.push(...uploadedImages);
    //       }

    //       const updatedProduct = await productsModel.findByIdAndUpdate(
    //         product._id,
    //         {
    //           $set: { images: product.images },
    //         }
    //       );

    //       return res.json({
    //         product: updatedProduct,
    //         message: "Product Images Updated Successfully",
    //       });
    //     } catch (error) {
    //       // console.log(error);
    //       res.status(500).json({ error: "Failed to update product images" });
    //     }
    //   };

    static addDiscount = async (req, res) => {
        try {
            const { productId } = req.params;
            const deal = req.body;

            let newDeal = await new dealModal({
                discount: deal.discount,
                ends: deal.ends,
                sellerId: req.seller._id
            }).save();

            await productsModel.findByIdAndUpdate(productId, {
                $push: { deals: newDeal }
            });
            return res.send({ message: "Discount Added Successfully" });
        }
        catch (err) {
            // console.log(err);
            res.status(400).send({ message: "Error Occurred" });
        }
    };

    static deleteDiscount = asyncErrorHandler(async (req, res, next) => {
        const { dealId } = req.params;
        let date = new Date().toISOString();

        console.log(dealId);

        await dealModal.findByIdAndUpdate(dealId, {
            $set: {
                deleted: true
            }
        });
        return res.send({ message: "Deal Successfully Deleted" });
    });

    static addDiscountByCategory = async (req, res) => {
        try {
            const { ends, discount } = req.body;
            const { category } = req.query;
            if (!category) {
                return res.status(400).send({ message: "Category Required" });
            }

            let newDeal = await dealModal.create({
                discount: discount,
                ends: ends,
                sellerId: req.seller._id
            });
            let query = {};
            query.sellerId = req.seller._id;

            if (category) {
                let categoryArr = category.split(",");
                if (categoryArr.includes("All")) {
                    categoryArr = [
                        "mobile",
                        "electronics",
                        "cloths",
                        "laptop",
                        "furniture"
                    ];
                }
                query.category = { $in: categoryArr };
            }

            let myProducts = await productsModel.updateMany(query, {
                $push: {
                    deals: newDeal._id
                }
            });
            return res.send({ message: "Deal Added Successfully" });
        }
        catch (err) {
            // console.log(err);
            return res.status(400).send({ message: "Error Occurred" });
        }
    };

    static addDiscountForTimeLimit = async (req, res) => {
        try {
            const { productId } = req.params;
            const deal = req.body;

            let newDeal = await new dealModal(deal).save();
            let product = await productsModel.findByIdAndUpdate(productId, {
                $push: { deals: newDeal._id }
            });
            // await productsModel.findByIdAndUpdate(productId,{
            //     $set:{
            //         deal:deal
            //     }
            // });
            return res.send({ message: "Discount Works", product: product });
        }
        catch (err) {
            // console.log(err);
            res.status(400).send({ message: "Error Occurred" });
        }
    };

    static addDiscountToAllProducts = async (req, res) => {
        try {
            const { ends, discount } = req.body;
            let products = await productsModel.find({
                "_org._id": req.seller._org._id
            });
            for (let product of products) {
                let deal = {
                    price: Math.ceil(
                        product.price - product.price * (parseInt(discount) / 100)
                    ),
                    discount: discount,
                    ends: ends
                };
                let newDeal = await new dealModal(deal).save();
                await productsModel.findByIdAndUpdate(product._id, {
                    $push: { deals: newDeal._id }
                });
            }
            return res.send({ message: "Discount Added Successfully" });
        }
        catch (err) {
            // console.log(err);
            return res.status(400).send({ message: "Error Occurred" });
        }
    };

    static addDiscountToAllProductsOfIndividualSeller = async (req, res) => {
        try {
            const { ends, discount } = req.body;
            let products = await productsModel.find({ sellerId: req.seller._id });
            for (let product of products) {
                let deal = {
                    price: Math.ceil(
                        product.price - product.price * (parseInt(discount) / 100)
                    ),
                    discount: discount,
                    ends: ends
                };
                let newDeal = await new dealModal(deal).save();
                await productsModel.findByIdAndUpdate(product._id, {
                    $push: { deals: newDeal._id }
                });
            }
            return res.send({ message: "Discount Added Successfully" });
        }
        catch (err) {
            return res.status(400).send({ message: "Error Occurred from All" });
        }
    };

    static searchProduct = async (req, res) => {
        res.send({ message: "SuccessFul Search Api" });
    };


    static editStock = asyncErrorHandler(async (req,res,next)=>{
        const stock = req.body;
        const {productId} = req.params;
        if(!stock){
            next(new CustomError("Please Provide Valid Stock",400));
        }

        await productsModel.findByIdAndUpdate(productId,{
            $set: stock
        });
        return res.status(200).send({message:"Stock Updated Successfully"});
    });

}

export default ProductsController;

/*
pipeLine For Getting One Product

const pipeline = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(productId)
                    }
                },
                {
                    $lookup: {
                        from: "deals",
                        localField: "deals",
                        foreignField: "_id",
                        as: "dealsInfo"
                    }
                },
                {
                    $unwind: {
                        path: "$dealsInfo",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "ratings",
                        localField: "reviews",
                        foreignField: "_id",
                        as: "rev"
                    }
                },
                {
                    $unwind: {
                        path: "$rev"
                    }
                },
                {
                    $match: {
                        $or: [
                            { dealsInfo: { $exists: false } },
                            { "dealsInfo.ends": { $gte: currentDate.toISOString() } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        name: { $first: "$name" },
                        description: { $first: "$description" },
                        images: { $first: "$images" },
                        price: { $first: "$price" },
                        _org: { $first: "$_org" },
                        deals: { $push: "$dealsInfo" },
                        reviews: {$push: "$rev"}
                    }
                }
            ];

            const product = await productsModel.aggregate(pipeline);
            console.log(product);

*/
