import orderModel from "../models/orders.model.js";
import productsModel from "../models/product.model.js";
import joiMiddeleware from "../Middeleware/joyMiddeleware.js";
import asyncErrorHandler from "./asyncErrorHandler.js";
import CustomError from "../Middeleware/customError.js";
import puppeteer from "puppeteer";
import fs from "fs";
import Stripe from "stripe";

const stripe = Stripe("sk_test_51NgmZISCwJJI0EIGfbbjsDjhuYJTP1EY4XhXQHeHaU1p5vCzB8mI97EWPZHCdFd9ue7EMk5AzIdEh3lGCOYBZmc000BaTbqBgh");

import handlebars from "handlebars";
import shopUserModel from "../models/shop-user.model.js";

class UserOrderController {

    static getOrderDemo = async (req, res) => {
        try {
            const { name, limit = 10, page = 1, sortBy } = req.query;
            const query = {};

            if (name) {
                query.name = { $regex: new RegExp(name, "i") };
            }
            const skip = (page - 1) * limit;
            let sortOptions = {};
            if (sortBy) {
                sortOptions[sortBy] = 1;
            }

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
                                    _id: 0,
                                    createdAt:0,
                                    updatedAt:0,
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
                const sortOptions = {};
                sortOptions[sortBy] = 1;
                aggregationPipeline.unshift({ $sort: sortOptions });
            }
            const orders = await productsModel.aggregate(aggregationPipeline);
            const totalCount = await productsModel.countDocuments(query);
            const totalPages = Math.ceil(totalCount / limit);
            res.status(200).json({
                orders,
                pagination: {
                    totalCount,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        }
        catch (error) {
            // console.error(error);
            res.status(500).json({ message: "Error fetching orders" });
        }
    
    };

    static createOrder = async (req, res) => {
        try {
            const { address, items, deliveryFee, total,mobileNo } = req.body;

            for(let item of items){
                const product = await productsModel.findById(item.productId);
                if(product.stock < (item.quantity*1)){
                    let msg = `${item.name} has only ${product.stock} items left`;
                    return res.status(400).send({message:msg});
                }
                else{
                    await productsModel.findByIdAndUpdate(product._id,{
                        $set:{
                            stock: (product.stock - (item.quantity*1))
                        }
                    });
                }
            }

            const orderData = {
                address: address,
                items: items,
                deliveryFee: deliveryFee,
                mobileNo:mobileNo,
                total: total,
                createdBy: req.shopUser._id
            };

            // Create the order
            const newOrder = await orderModel.create(orderData);
            let demo = {
                order: newOrder
            };

            return res.send(demo);
        }
        catch (error) {
            console.error("Error creating order:", error);
            return res.status(400).send({ message: "Error Occurred" });
        }
    };


    static confirmOrderStripe = asyncErrorHandler(
        async (req, res,next) => {
            try {
                console.log("Called");
                const { cardNumber, expiry, cvv } = req.body;
                // Create a PaymentMethod using the card details
                const paymentMethod = await stripe.paymentMethods.create({
                    type: "card",
                    card: {
                        number: cardNumber,
                        exp_month: expiry.split("/")[0],
                        exp_year: expiry.split("/")[1],
                        cvc:cvv
                    }
                });
    
                // Create a PaymentIntent to confirm the payment
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: 1000 * 100, // Adjust the amount as needed (in cents)
                    currency: "inr", // Change to your desired currency
                    payment_method: paymentMethod.id,
                    confirm: true
                });
    
                res.json({ success: true, paymentIntent });
            }
            catch (error) {
                console.error(error);
                next(CustomError("Payment failed!",400));
            }
        }
    );


    static confirmOrder = asyncErrorHandler(async (req, res,next) => {
        const { cardNumber, expiry } = req.body;
        await joiMiddeleware.cardDetails.validateAsync(req.body);

        try {
            this.validateCard(cardNumber);
            let a = expiry.split("/");
            let nowDay = new Date().getMonth() + 1;
            let nowYear = new Date().getFullYear();

            if (parseInt(a[1]) < nowYear) {
                return res.status(400).send({ message: "Card Is Expired" });
            }
            else if (parseInt(a[1]) == nowYear && parseInt(a[0]) < nowDay) {
                return res.status(400).send({ message: "Card Is Expired" });
            }
            else if (cardNumber.toString().length != 16) {
                return res.status(400).send({ message: "Please Enter Valid Card Number" });
            }
            else {
                let orderId = req.params.orderId;
                let order = await orderModel.findById(orderId);

                let arr = [];
                for (let item of order.items) {
                    let product = await productsModel.findById(item.productId);
                    let isPresent = false;
                    for (let sel of arr) {
                        if (sel.sellerId == product.sellerId.toString()) {
                            sel.items.push(item);
                            isPresent = true;
                        }
                    }
                    if (!isPresent) {
                        let obj = { sellerId: product.sellerId, items: [item] };
                        arr.push(obj);
                    }
                }

                let transactionNo = this.randomString();
                for (let item of arr) {
                    let countPrice = 0;
                    for (let demo of item.items) {
                        countPrice += parseInt(demo.subTotal);
                    }

                    let obj = {
                        address: order.address,
                        items: item.items,
                        deliveryFee: order.deliveryFee,
                        mobileNo:order.mobileNo || "##########",
                        cardDetails:req.body,
                        total: countPrice,
                        paymentStatus: "Paid",
                        status: "Confirmed",
                        sellerId: item.sellerId,
                        "_org": item.items[0]._org,
                        transactionNo: transactionNo,
                        createdBy: order.createdBy,
                        deleted: false
                    };            
                    let doc = new orderModel(obj);
                    await doc.save();
                }

                await orderModel.findByIdAndUpdate(orderId,{
                    $set:{deleted:true}
                });

                return res.send({
                    message: "Payment Successfull. Your order is successfully placed!"
                });
            }
        }
        catch (err) {
            console.log(err);
            next(new CustomError("Error Occurred",400));
        //return res.status(400).send({ message: "Error Occurred" });
        }
    
    });

    static validateCard(cardNumber){
        let isnum = /^\d+$/.test(this.trimString(cardNumber));
        return isnum;
    }

    static trimString(str) {
        let temp = "";
        str=str+"";
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) != " ") {
                temp += str.charAt(i);
            }
        }
        return temp;
    }

    static randomString = function generateRandomString() {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomString = "";

        for (let i = 0; i < 8; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            const randomChar = characters.charAt(randomIndex);
            randomString += randomChar;
        }
        return randomString;
    };

    static getOrders = async (req, res) => {
        try {
            const { limit = 10, page = 1 } = req.query;
            const skip = (page-1)*limit;

            const total = await orderModel.countDocuments({createdBy: req.shopUser._id,deleted:false});

            let result = await orderModel.find({createdBy:req.shopUser._id,deleted:false}).skip(skip).limit(limit).sort({createdAt:-1}).exec();

            let obj = {
                results: result,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total/limit),
                totalResults: total
            };
            // console.log(users);
            res.send(obj);
        }
        catch (err) {
            // console.log(err);
            return res.status(400).send({
                results: [],
                page: 0,
                limit: 0,
                totalPages: 0,
                totalResults: 0
            });
        }
    };

    static orderDetails = async (req, res) => {
        try {
            let { orderId } = req.params;
            let order = await orderModel.findById(orderId).lean();
            let createdBy = await shopUserModel.findById(order.createdBy).lean();
            order.user = createdBy;
            return res.status(200).send(order);

        }
        catch (err) {
            return res.status(400).send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate"
            });
        }
    };

    static cancelOrder = async (req, res) => {
        try {
            let { orderId } = req.params;
            await orderModel.findByIdAndUpdate(orderId, {
                $set: {
                    paymentStatus: "Refunded",
                    status: "Cancelled"
                }
            });
            return res.send({ message: "Order Cancelled Successfully" });
        }
        catch (err) {
            return res.status(400).send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate"
            });
        }
    };

    // Invoice Generator Logic Here
    static generateInvoice = async (req, res) => {
        try {
            const order = await orderModel.findById(req.params.orderId);

            const handlebarsOptions = {
                allowProtoPropertiesByDefault: true
            };
            const compiledTemplate = handlebars.compile(
                fs.readFileSync("./views/index.hbs", "utf8"),
                handlebarsOptions
            );
            let finalSubtotal = 0;
            for(let item of order.items){
                finalSubtotal+= item.price* item.quantity;
            }

            const context = {
                ...order,
                items: order.items.map((item) => ({
                    name: item.name,
                    price: item.price.toFixed(2),
                    quantity:item.quantity,
                    subTotal:item.subTotal.toFixed(2),
                    discountPrice:(item.price-item.discountPrice).toFixed(2)
                })),
                total:order.total,
                deliveryFee:order.deliveryFee,
                transactionNo:order.transactionNo || "######",
                address:order.address,
                finalSubtotal:finalSubtotal.toFixed(2)
            };
            const renderedInvoice = compiledTemplate(context);
            const puppeteerOptions = {
                headless: "new"
            };
            const browser = await puppeteer.launch(puppeteerOptions);
            const page = await browser.newPage();
            await page.setContent(renderedInvoice);
            const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
            await browser.close();
  
            res.contentType("application/pdf");
            res.send(pdfBuffer);
        }
        catch (err) {
            // console.error('Error generating invoice:', err);
            res.status(500).json({ error: "Error generating invoice" });
        }
  
    };
}

export default UserOrderController;
