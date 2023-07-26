/* eslint-disable no-undef */
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import sellerModel from "../Models/seller.js";

class UserController {
    static getUsers = async (req, res) => {
        try {
            //console.log(params);
            const { limit, page, role } = req.query;

            let countTotalResult = await sellerModel.find({
                "_org._id": req.seller._org._id
            });

            let resResult = countTotalResult.length;
            //console.log(countTotalResult,"Working");
            let u = await this.getUsersByQuery(req.query, req.seller._org._id);

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

            let totalPages = Math.ceil(u.length / countLimit);
            if (totalPages == 0) {
                totalPages = 1;
            }

            let countrole = 0;
            if (role) {
                for (let item of countTotalResult) {
                    if (item.role == role) {
                        countrole++;
                    }
                }
                totalPages = Math.ceil(countrole/countLimit);
                resResult = countrole;
            }

            u = u.filter(data=>data.deleted==false);

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
            let query = sellerModel.find({ "_org._id": id });
            if (filterParams.name) {
                query = query.where("name").equals(filterParams.name);
            }

            if (filterParams.role) {
                query = query.where("role").equals(filterParams.role);
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

            const countQuery = sellerModel.find({ "_org._id": id}).countDocuments();
            let totalUsers = await countQuery.exec();

            if(filterParams.role){
                let cnt = 0;
                let myQuery =await sellerModel.find({ "_org._id": id });
                for(let item of myQuery){
                    if(item.role==filterParams.role){
                        cnt++;
                    }
                }

                totalUsers = cnt;
            }

            // Calculate the total number of pages based on the filtered results
            const totalPages = Math.ceil(totalUsers / limit);

            //console.log(totalUsers,"From Limit");

            if (page > totalPages) {
                return new Error("Invalid Page Number");
                //console.log("Invalid page number. No data available.");
            }
            const skip = (page - 1) * limit;
            query = query.skip(skip);

            const users = await query.exec();
            //console.log(users,"From Users")
            return users;
        }
        catch (error) {
            //console.error("Error getting users:", error);
        }
    };



    static updateCompanyInfo = async(req,res)=>{
        const {email,name} = req.body;
        if(email=="" || email==undefined || email==null){
            return res.send({
                code: 400,
                message: "Email Is Requires",
                stack: "Error: Please Provide Valid Email"
            });
        }
        else if(name=="" || name==undefined || name==null){
            return res.send({
                code: 400,
                message: "Company Name Is Requires",
                stack: "Error: Please Provide Valid Company Name"
            });
        }
        else{
            try{
                //console.log(req.seller)
                await sellerModel.updateMany({"_org._id":req.seller._org._id},{
                    "_org.name":name,
                    "_org.email":email
                });
                return res.send({message:"Company Information Updated Successfully"});
            }
            catch(err){
                res.send({
                    code: 400,
                    message: "Unable To Update Company Info",
                    stack: "Error: Something Went Wrong on server"
                });
            }
        }
   
    };


    static createUser = async (req, res) => {
    //console.log(req.seller);

        const { name, email, password, role } = req.body;

        const seller = await sellerModel.findOne({ email: email });

        //console.log(req.query, "From Params");

        if (seller) {
            let obj = {
                code: 400,
                message: "There is already an account with this email address",
                stack: "Error: There is already an account with this email address"
            };
            return res.send(obj);
        }
        else {
            if (name == "") {
                return res.send({
                    code: 400,
                    message: "\"name\" is not allowed to be empty",
                    stack: "Error: name is not allowed to be empty"
                });
            }
            else if (email == "") {
                return res.send({
                    code: 400,
                    message: "\"email\" is not allowed to be empty",
                    stack: "Error: email is not allowed to be empty"
                });
            }
            else if (password == "") {
                return res.send({
                    code: 400,
                    message: "\"Password\" is not allowed to be empty",
                    stack: "Error: password is not allowed to be empty"
                });
            }
            else if (role == "") {
                return res.send({
                    code: 400,
                    message: "\"Role\" is not allowed to be empty",
                    stack: "Error: Company Name is not allowed to be empty"
                });
            }
            else {
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashPassword = await bcrypt.hash(password, salt);

                    const doc = new sellerModel({
                        name: name,
                        _org: req.seller._org,
                        email: email,
                        password: hashPassword,
                        role: role,
                        isEmailVerified: false,
                        deleted: false
                    });
                    await doc.save();
                    let savedSeller = await sellerModel
                        .findOne({ email: email })
                        .select("-users")
                        .select("-password");

                    // await sellerModel.findByIdAndUpdate(savedSeller._id,{
                    //     $set:{
                    //         users:[savedSeller]
                    //     }
                    // })

                    //Generating Token Here
                    const token = jwt.sign(
                        { sub: savedSeller._id, type: "access" },
                        process.env.JWT_SECRET_KEY,
                        { expiresIn: "1d" }
                    );
                    let expiryDate = "";
                    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                        if (err) {
                            // console.error("Token verification failed:", err);
                        }
                        else {
                            expiryDate = new Date(decoded.exp * 1000);
                            //console.log("Token expiry date:", expiryDate);
                        }
                    });

                    let obj = {
                        user: savedSeller,
                        token: token,
                        expires: expiryDate
                    };
                    return res.send(obj);
                }
                catch (err) {
                    //console.log("Error", err);
                    return res.send({message:"Error Occurrred"});
                }
            }
        }
    //return res.send("Create User Works")
    };

    static updateUserInfo = async(req,res)=>{
  
        let userId = req.params.userId;
        //console.log(userId);

        const {email,password,name} = req.body;
        if(userId==null || userId==undefined || userId==""){
            return res.status(400).send({
                code: 400,
                message: "UserId Should not Be Empty",
                stack: "Error: UserId Should not Be Empty"
            });
        }
        else if(email=="" || email==undefined || email==null){
            return res.status(404).send({
                code: 400,
                message: "\"Email\" is not allowed to be empty",
                stack: "Error: Email Name is not allowed to be empty"
            });
        }
        else if(name=="" || name==undefined || name==null){
            return res.status(404).send({
                code: 400,
                message: "\"Name\" is not allowed to be empty",
                stack: "Error: Name is not allowed to be empty"
            });
        }
        else if(password=="" || password==null || password==undefined){
            return res.status(400).send({
                code: 400,
                message: "\"Password\" is not allowed to be empty",
                stack: "Error: Password is not allowed to be empty"
            });
        }
        else{
            try{
                const salt = await bcrypt.genSalt(10);
                const hashPassword = await bcrypt.hash(password, salt);

                let user = await sellerModel.findById(userId).select("-password");
    
                if(user==null || user==undefined){
                    res.status(400).send({
                        code: 400,
                        message: "Please Provide Valid UserId",
                        stack: "Error: User does not Exist With This Id"
                    });
                }

                await sellerModel.findByIdAndUpdate(userId,{
                    $set:{
                        name:name,
                        email:email,
                        password:hashPassword
                    }
                });

                let updatedUser = await sellerModel.findById(userId).select("-password");
                //console.log(updatedUser,"From Node")
                return res.send(updatedUser);

            }
            catch(err){
                // console.log(err);
                res.send({
                    code: 400,
                    message: "Please Provide Valid UserId",
                    stack: "Error: User does not Exist With This Id"
                });
            }
        }
    };

    static updateUserRole = async(req,res)=>{
    //console.log(req.params.userId);
        let userId = req.params.userId;
        const {role} = req.body;

        if(userId==null || userId==undefined || userId==""){
            return res.status(400).send({
                code: 400,
                message: "UserId Should not Be Empty",
                stack: "Error: UserId Should not Be Empty"
            });
        }
        else if(role=="admin" || role=="user"){
            try{
                let user = await sellerModel.findById(userId);
                if(user==null || user==undefined){
                    res.status(400).send({
                        code: 400,
                        message: "Please Provide Valid UserId",
                        stack: "Error: User does not Exist With This Id"
                    });
                }

                await sellerModel.findByIdAndUpdate(user._id,{
                    $set:{
                        role:role
                    }
                });
                return res.send({message:"User role Updated Successfully"});

            }
            catch(err){
                return res.status(400).send({
                    code: 400,
                    message: "Please Provide Valid UserId",
                    stack: "Error: User does not Exist With This Id"
                });
            }
        }
        else{
            return res.status(400).send({
                code: 400,
                message: "Role Must Be \"user\" or \"password\"",
                stack: "Role Must Be \"user\" or \"password\""
            });
        }
    };

    static deleteUser = async(req,res)=>{
    //console.log(req.params.userId);
        let userId = req.params.userId;

        if(userId){
            try{
                let user = await sellerModel.findById(userId);
                if(user==null || user==undefined){
                    res.send({
                        code: 400,
                        message: "Please Provide Valid UserId",
                        stack: "Error: User does not Exist With This Id"
                    });
                }
                await sellerModel.findByIdAndUpdate(userId,{
                    $set:{
                        deleted:true
                    }
                });
                return res.send({message:"User Deleted Successfully"});
            }
            catch(err){
                return res.status(400).send({
                    code: 400,
                    message: "Please Provide Valid UserId",
                    stack: "Error: User does not Exist With This Id"
                });
            }
        }
        else{
            return res.status(400).send({
                code: 400,
                message: "Not a valid UserId",
                stack: "Please Provide valid UserId"
            });
        }
    };

    static searchProduct = async(req,res)=>{
        res.send({message:"Works"});
    };
}

export default UserController;
