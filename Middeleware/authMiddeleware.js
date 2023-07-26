import jwt from "jsonwebtoken";
import sellerModel from "../Models/seller.js";

const checkAuth = async(req,res,next)=>{
    //console.log(req.headers.authorization,"Middeleware Called");
    if(req.headers.authorization != undefined){
        try{
            let token = req.headers.authorization.split(" ")[1];
            // eslint-disable-next-line no-undef
            let result =jwt.verify(token, process.env.JWT_SECRET_KEY);
            result = result.sub;
            let seller = await sellerModel.findById(result).select("-password");
            req.seller = seller;
            next();
        }
        catch(err){
            return res.status(400).send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate"
            });
        }
    }
    else{
        return res.status(400).send({
            code: 400,
            message: "Please Authenticate",
            stack: "Error: Please Authenticate"
        });
    }
};

export default checkAuth;