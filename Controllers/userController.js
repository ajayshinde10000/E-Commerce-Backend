import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


class UserController{
    static getUsers = async(req,res)=>{

        let params = req.query;
        if(params){
            console.log("True",params)
        }

        let totalPages = Math.ceil(req.seller.users.length/10);
        let obj = {
            "results":req.seller.users,
            "page":1,
            "limit":10,
            "totalPages":totalPages,
            "totalResults":req.seller.users.length
        }

        console.log(req.seller.users);
        res.send(obj);
    }
}

export default UserController;