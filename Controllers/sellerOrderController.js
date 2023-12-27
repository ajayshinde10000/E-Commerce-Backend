import orderModel from "../Models/orders.js";
class SellerOrderController{
    static getOrders = async(req,res)=>{
        try {
            const { limit, page, name } = req.query;
      
            let countTotalResult = await orderModel.find({
                "sellerId": req.seller._id
            });
      
            let resResult = countTotalResult.length;
            //console.log(countTotalResult,"Working");
            let u = await this.getUsersByQuery(req.query, req.seller._id);
      
            if(u.length==undefined){
                //console.log(u.length)
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

            if(name){
                try{
                    let product = await orderModel.find({name:name});
                    return res.send({
                        results: product,
                        page: 1,
                        limit: 10,
                        totalPages: 1,
                        totalResults: 1
                    });
                }
                catch(err){
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
      
            u = u.filter((data)=>data.paymentStatus=="Paid");
      
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
            let query = orderModel.find({ "sellerId": id });
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
      
            const countQuery = orderModel.find({ "sellerId": id}).countDocuments();
            let totalUsers = await countQuery.exec();
      
          
            // Calculate the total number of pages based on the filtered results
            const totalPages = Math.ceil(totalUsers / limit);
            //console.log(totalUsers,"From Limit");
      
            if (page > totalPages) {
                return new Error("Invalid Page Number");
                //console.log("Invalid page number. No data available.");
            }
            const skip = (page - 1) * limit;
            query = query.skip(skip);
      
            const products = await query.exec();
            //console.log(products,"From Products")
            return products;
        }
        catch (error) {
            //console.error("Error getting Products:", error);
        }
    };



    static orderDetails = async(req,res)=>{
        try{
            let {orderId} = req.params;
            //.log(orderId,"From OrderId");
            let order = await orderModel.findById(orderId);
            //console.log(order,"Order")
            return res.send(order);
        }
        catch(err){
            return res.send({
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
            return res.send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate"
            });
        }
    };
      
}

export default SellerOrderController;