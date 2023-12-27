import productsModel from "../models/product.model.js";

class SearchController {
    static searchProduct = async (req, res) => {
        try {
            let { value } = req.query;
            if (value) {
                let products = await productsModel.find({
                    $or: [
                        { name: { $regex: value, $options: "i" } },
                        { description: { $regex: value, $options: "i" } },
                        { category: { $regex: value, $options: "i" } }
                    ]
                }).select("-sellerId").limit(10);
                res.send(products);
            }
            else {
                res.send([]);
            }
        }
        catch (err) {
            res.status(400).send({ message: "Error Occurred" });
        }
    };

    static getProductsFromDeal = async(req,res)=>{

        try {
            const firstTenProducts = await productsModel.find().limit(10).populate({
                path: "deals",
                match: { ends: { $gt: new Date() } } // Filter for valid deals (ends after the current time)
            }).exec();
        
            // Filter deals array in each product to keep only valid (active) deals
            firstTenProducts.forEach((product) => {
                product.deals = product.deals.filter((deal) => {
                    return deal;
                });
            });
        
            return res.json(firstTenProducts);
        }
        catch (error) {
            // console.error("Error retrieving products:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    };

    static getProductByCategory = async(req,res)=>{
        try{
            let {category} = req.query;
            let products = await productsModel.find({category: category},{deleted:false}).limit(4);
            res.send(products);
        }
        catch(err){
            res.status(400).send("Error Occurred");
        }
    };


}

export default SearchController;
