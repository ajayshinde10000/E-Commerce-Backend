import shopUserModel from "../Models/shopUser.js";

class ShopUserController{
    static getUser = async(req,res)=>{
        res.send("Get User Works");
    }
}

export default ShopUserController;