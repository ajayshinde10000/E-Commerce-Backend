import orderModel from "../models/orders.model.js";
import handlebars from "handlebars";
import fs from "fs";
import puppeteer from "puppeteer";

class SellerOrderController{
    static getOrders = async(req,res)=>{
        try {
            const { limit = 10, page = 1 } = req.query;
            const skip = (page-1)*limit;
            const total = await orderModel.countDocuments({sellerId: req.seller._id});
            let result = await orderModel.find({sellerId:req.seller._id}).skip(skip).limit(limit).sort({createdAt:-1}).exec();
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
      
  

    static orderDetails = async(req,res)=>{
        try{
            let {orderId} = req.params;
            let order = await orderModel.findById(orderId);
            return res.send(order);
        }
        catch(err){
            return res.status(400).send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate"
            });
        }
    };

    static changeAction = async(req,res)=>{
        try{
            let {action, orderId} = req.params;
            if(action=="cancel"){
                await orderModel.findByIdAndUpdate(orderId,{
                    $set:{
                        status:"Cancelled",
                        paymentStatus:"Refunded"
                    }
                });
                return res.send({message: `Order ${action} Successfully`});
            }
            else if(action == "dispatch"){
                await orderModel.findByIdAndUpdate(orderId,{
                    $set:{
                        status:"Dispatched"
                    }
                });

                return res.send({message: `Order ${action} Successfully`});
            }
            else if(action=="deliver"){
                await orderModel.findByIdAndUpdate(orderId,{
                    $set:{
                        status:"Delivered"
                    }
                });

                return res.send({message: `Order ${action} Successfully`});
            }
            else{
                return res.status(400).send({
                    code: 400,
                    message: "Please Provide Valid Action",
                    stack: "Error: Please Provide Valid Action"
                });
            }
        }
        catch(err){
            // console.log(err);
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

export default SellerOrderController;