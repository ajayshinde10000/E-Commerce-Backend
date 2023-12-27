import orderModel from "../Models/orders.js";
import productsModel from "../Models/product.js";
import sellerOrderModel from "../Models/sellerOrders.js";

class UserOrderController {
    // static getOrder = async(req,res)=>{
    //     return res.send("Order Management Works");
    // }

    static createOrder = async (req, res) => {
        try {
            const { address, items, deliveryFee, total } = req.body;
            const orderData = {
                address: address,
                items: items,
                deliveryFee: deliveryFee,
                total: total,
                createdBy: req.shopUser._id
            };

            // Create the order

            const newOrder = await orderModel.create(orderData);
            let demo = {
                order: newOrder
            };
            //console.log("Order created successfully:", demo);

            // This Object to be send to User After Compliting order
            // {
            //     "address": {
            //         "street": "Balewadi High Street Pune",
            //         "addressLine2": "Near Zudio",
            //         "city": "Pune",
            //         "state": "Maharashtra",
            //         "pin": "413515"
            //     },
            //     "_id": "649ec1268314b2229df05105",
            //     "items": [
            //         {
            //             "productId": "62dc3878305fe3040d7f4bcf",
            //             "name": "Second Product",
            //             "price": 1898,
            //             "qty": 1,
            //             "subTotal": 1898,
            //             "_id": "649ec1268314b2229df05106"
            //         }
            //     ],
            //     "deliveryFee": 0,
            //     "total": 1898,
            //     "paymentStatus": "Pending",
            //     "status": "Pending",
            //     "createdBy": "6468838cec6d46ce7b8e0533",
            //     "deleted": false,
            //     "createdAt": "2023-06-30T11:48:54.309Z",
            //     "updatedAt": "2023-06-30T11:48:54.309Z",
            //     "__v": 0
            // }

            return res.send(demo);
        }
        catch (error) {
            // console.error("Error creating order:", error);
            return res.status(400).send({ message: "Error Occurred" });
        }
    };

    static confirmOrder = async (req, res) => {
        const { nameOnCard, cardNumber, expiry, cvv } = req.body;
        if (nameOnCard == "" || nameOnCard == undefined || nameOnCard == null) {
            return res.send({
                code: 400,
                message: "Name On card Is Required",
                stack: "Error: Name On Card Is Required"
            });
        }
        else if (
            cardNumber == "" ||
      cardNumber == undefined ||
      cardNumber == null
        ) {
            return res.send({
                code: 400,
                message: "Card Number Is Required",
                stack: "Error: Card Number Is Required"
            });
        }
        else if (
            cvv.length != 3 ||
      cvv == "" ||
      cvv == undefined ||
      cvv == null
        ) {
            return res.send({
                code: 400,
                message: "Please Enter Valid CVV",
                stack: "Error: Please Enter valid CVV"
            });
        }
        else if (expiry == "" || expiry == undefined || expiry == null) {
            return res.send({
                code: 400,
                message: "Expiry Date card Is Required",
                stack: "Error: Expiry Date Is Required"
            });
        }
        else {
            try {
                let a = expiry.split("/");
                //console.log(a);

                let nowDay = new Date().getMonth() + 1;
                // console.log(nowDay, "From Now Day");
                let nowYear = new Date().getFullYear();

                if (parseInt(a[1]) < nowYear) {
                    return res.send({ message: "Card Is Expired" });
                }
                else if (parseInt(a[1]) == nowYear && parseInt(a[0]) < nowDay) {
                    return res.send({ message: "Card Is Expired" });
                }
                else if (cardNumber != "4111111111111111") {
                    return res.send({ message: "This card Is not Accepted For Payment" });
                }
                else {
                    let orderId = req.params.orderId;
                    let order = await orderModel.findById(orderId);
                    // console.log(order);
                    let arr = [];
                    for (let item of order.items) {
                        let product = await productsModel.findById(item.productId);
                        //console.log(product,"From Product")
                        let isPresent = false;
                        for (let sel of arr) {
                            if (sel.sellerId == product.sellerId) {
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
                            //console.log("Items Called");
                            countPrice += parseInt(demo.subTotal);
                        }

                        let obj = {
                            address: order.address,
                            items: item.items,
                            deliveryFee: order.deliveryFee,
                            total: countPrice,
                            paymentStatus: "Paid",
                            status: "Confirmed",
                            sellerId: item.sellerId,
                            transactionNo: transactionNo,
                            createdBy: order.createdBy,
                            deleted: false
                        };

                        let doc = new orderModel(obj);
                        await doc.save();
                    }

                    await orderModel.findByIdAndDelete(orderId);

                    return res.send({
                        message: "Your order is successfully placed!"
                    });
                }
            }
            catch (err) {
                return res.send({ message: "Error Occurred" });
            }
        }
    };

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
            const { limit, page, name } = req.query;

            let countTotalResult = await orderModel.find({
                createdBy: req.shopUser._id
            });

            let resResult = countTotalResult.length;
            //console.log(countTotalResult,"Working");
            let u = await this.getUsersByQuery(req.query, req.shopUser._id);

            if (u.length == undefined) {
                //console.log(u.length);
                throw Error("Invalid Page Number");
            }

            let countLimit = 10;
            let countPage = 1;

            if (limit) {
                countLimit = limit;
            }

            if (page) {
                countPage = page;
            }

            if (name) {
                try {
                    let product = await sellerOrderModel.find({ name: name });
                    return res.send({
                        results: product,
                        page: 1,
                        limit: 10,
                        totalPages: 1,
                        totalResults: 1
                    });
                }
                catch (err) {
                    return res.send({
                        results: [],
                        page: 1,
                        limit: 10,
                        totalPages: 1,
                        totalResults: 1
                    });
                }
            }

            let totalPages = Math.ceil(u.length / countLimit);
            if (totalPages == 0) {
                totalPages = 1;
            }


            let obj = {
                results: u,
                page: countPage,
                limit: countLimit,
                totalPages: totalPages,
                totalResults: resResult
            };
            // console.log(users);
            res.send(obj);
        }
        catch (err) {
            return res.send({
                results: [],
                page: 0,
                limit: 0,
                totalPages: 0,
                totalResults: 0
            });
        }
    };

    static getUsersByQuery = async (filterParams, id) => {
        try {
            let query = orderModel.find({ createdBy: id });
            if (filterParams.name) {
                query = query.where("name").equals(filterParams.name);
            }

            if (filterParams.sortBy) {
                query = query.sort(filterParams.sortBy);
            }

            let limit = 10; // Default limit to 10 if not provided
            if (filterParams.limit) {
                limit = parseInt(filterParams.limit);
            }
            query = query.limit(limit);

            let page = 1; // Default page to 1 if not provided
            if (filterParams.page) {
                page = parseInt(filterParams.page);
            }

            const countQuery = orderModel.find({ createdBy: id }).countDocuments();
            let totalUsers = await countQuery.exec();

            // Calculate the total number of pages based on the filtered results
            const totalPages = Math.ceil(totalUsers / limit);

            if (page > totalPages) {
                return new Error("Invalid Page Number");
                //console.log("Invalid page number. No data available.");
            }
            const skip = (page - 1) * limit;
            query = query.skip(skip);

            const products = await query.exec();
            //console.log(products, "From Products");
            return products;
        }
        catch (error) { /* empty */ }
    };

    static orderDetails = async (req, res) => {
        try {
            let { orderId } = req.params;
            let order = await orderModel.findById(orderId);
            return res.send(order);
        }
        catch (err) {
            return res.send({
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
            return res.send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate"
            });
        }
    };
}

export default UserOrderController;
