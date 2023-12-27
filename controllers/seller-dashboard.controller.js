/* eslint-disable no-useless-catch */
import asyncErrorHandler from "./asyncErrorHandler.js";
import orderModel from "../models/orders.model.js";
import sellerModel from "../models/seller.model.js";
import productsModel from "../models/product.model.js";
import mongoose from "mongoose";

class SellerDashboardController {
    static getData = asyncErrorHandler(async (req, res) => {
        try {
            const { from, to } = req.body;

            let totalProducts = await productsModel.countDocuments({
                sellerId: req.seller._id
            });

            let totalSellers = await sellerModel.countDocuments({
                _org: req.seller._org
            });

            let trendingProducts = await orderModel.aggregate([
                [
                    {
                        $match: {
                            sellerId: new mongoose.Types.ObjectId(req.seller._id)
                        }
                    },
                    {
                        $match: {
                            createdAt: {
                                $gte: new Date(`${from}-01-01`),
                                $lt: new Date(`${to}-01-01`)
                            }
                        }
                    },
                    {
                        $unwind: {
                            path: "$items",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $group: {
                            _id: "$items.productId",
                            soldCount: { $sum: "$items.quantity" },
                            totalSales: { $sum: "$items.subTotal" },
                            name: { $first: "$items.name" },
                            productId: { $first: "$items.productId" },
                            images: { $first: "$items.images" },
                            price: { $first: "$items.price" },
                            category: { $first: "$items.category" },
                            description: { $first: "$items.description" }
                        }
                    },
                    {
                        $sort: {
                            soldCount: -1
                        }
                    },
                    { $limit: 10 }
                ]
            ]);

            const totalSales = await orderModel.aggregate([
                {
                    $match: {
                        sellerId: new mongoose.Types.ObjectId(req.seller._id)
                    }
                },
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(`${from}-01-01`),
                            $lt: new Date(`${to}-01-01`)
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        price: { $sum: "$total" }
                    }
                }
            ]);

            let salesPerMonth = await orderModel.aggregate([
                {
                    $match: {
                        sellerId: new mongoose.Types.ObjectId(req.seller._id)
                    }
                },
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(`${from}-01-01`),
                            $lt: new Date(`${to}-01-01`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { month: { $month: { $toDate: "$createdAt" } } },
                        totalOrders: { $sum: 1 }
                    }
                }
            ]);

            let catPer = await orderModel.aggregate([
                {
                    $match: {
                        sellerId: new mongoose.Types.ObjectId(req.seller._id)
                    }
                },
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(`${from}-01-01`),
                            $lt: new Date(`${to}-01-01`)
                        }
                    }
                },
                {
                    $unwind: "$items"
                },
                {
                    $group: {
                        _id: "$items.category",
                        totalQuantity: { $sum: "$items.quantity" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        categories: {
                            $push: {
                                category: "$_id",
                                totalQuantity: "$totalQuantity"
                            }
                        },
                        totalQuantitySum: { $sum: "$totalQuantity" }
                    }
                },
                {
                    $unwind: "$categories"
                },
                {
                    $addFields: {
                        "categories.percentage": {
                            $multiply: [
                                { $divide: ["$categories.totalQuantity", "$totalQuantitySum"] },
                                100
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        salesByCategory: { $push: "$categories" },
                        totalPercentage: { $sum: "$categories.percentage" }
                    }
                }
            ]);

            let salesByCategoryArr = [];
            catPer[0]?.salesByCategory.forEach((data) => {
                let obj = {
                    name: data.category,
                    y: data.percentage
                };
                salesByCategoryArr.push(obj);
            });

            const monthlyOrdersArray = Array.from({ length: 12 }, (_, i) => {
                const monthData = salesPerMonth.find(
                    (item) => item._id.month === i + 1
                );
                return monthData ? monthData.totalOrders : 0;
            });

            let totalOrders = 0;
            monthlyOrdersArray.forEach((data) => {
                totalOrders += data;
            });
            return res.send({
                totalOrders,
                monthlyStat: monthlyOrdersArray,
                totalProducts,
                totalSellers,
                totalSales: totalSales[0]?.price || 0,
                salesByCategory: salesByCategoryArr,
                trendingProducts
            });
        }
        catch (error) {
            throw error;
        }
    });
}

export default SellerDashboardController;
