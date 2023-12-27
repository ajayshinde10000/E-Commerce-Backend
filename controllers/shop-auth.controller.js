/* eslint-disable no-undef */
import shopUserModel from "../models/shop-user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import emailsModel from "../models/emails.model.js";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import {mongoose} from "mongoose";
import asyncErrorHandler from "./asyncErrorHandler.js";
import CustomError from "../Middeleware/customError.js";
import joyMiddeleware from "../Middeleware/joyMiddeleware.js";

const CLIENT_ID = "574427248919-k87r9tjbn5qkl74fdqvisk0p159ed176.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

class ShopAuthController {
    static register = asyncErrorHandler(async (req, res,next) => {
        let response = req.body.captcha;
        let captchaResult = await this.verifyRecaptcha(response);
        const {success} = captchaResult;
        if(!success){
            next(new CustomError("Re-Captcha Verification Failed",400));
        }

        const { name, email, password } = req.body;
        let {address} = req.body;

        if(!address){
            address = [];
        }
        else{
            var newId = new mongoose.Types.ObjectId();
            address._id = newId;
        }
        const shopUser = await shopUserModel.findOne({ email: email });

        if (shopUser) {
            next(new CustomError("There is already an account with this email address",400));
        }
        else {
            let obj = {
                name:req.body.name,
                email:req.body.email,
                password:req.body.password,
                captcha:req.body.captcha
            };

            await joyMiddeleware.userRegister.validateAsync(obj);
            try{
                const salt = await bcrypt.genSalt(10);
                const hashPassword = await bcrypt.hash(password, salt);
                const doc = new shopUserModel({
                    name: name,
                    email: email,
                    password:hashPassword,
                    deleted: false,
                    addresses:address
                });
                await doc.save();
                let savedShopUser = await shopUserModel.findOne({ email: email }).select("-password");
                const token = jwt.sign(
                    { sub: savedShopUser._id,type: "access" },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: "1d" }
                );
                let expiryDate = "";
                jwt.verify(token,  process.env.JWT_SECRET_KEY, (err, decoded) => {
                    if (err) {
                        // console.error('Token verification failed:', err);
                    }
                    else {
                        expiryDate = new Date(decoded.exp * 1000);
                    }
                });
        
                let obj = {
                    "customer" : savedShopUser,
                    "token":token,
                    "expires":expiryDate
                };
                return res.send(obj);
        
            }
            catch(err){
                next(new CustomError("Error Occurred",400));
            }
        }
    });

    static verifyRecaptcha = async (response) => {
        const secretKey = "6LcDrP0mAAAAALRFSn3BceF6Vr1nckEoyNPG1o0C";
        try {
            const url = `https://www.google.com/recaptcha/api/siteverify?response=${response}&secret=${secretKey}`;
            const options = {
                url: url,
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            };
            const { data } = await axios(options);
            return data;
        }
        catch (error) {
            return false;
        }
    };

    static login = async(req,res)=>{
        let response = req.body.captcha;
        console.log("response called");
        let captchaResult = await this.verifyRecaptcha(response);
        const {success} = captchaResult;
        const {email,password} = req.body;
        req.query.captcha;

        if(success){
            if(email!="" && password!=""){
                let shopUser = await shopUserModel.findOne({email:email});
                if(shopUser){
                    const isMatch = await bcrypt.compare(password, shopUser.password);
                    let savedUser = await shopUserModel.findOne({email:email}).select("-password");
                
                    if(savedUser.deleted){
                        return res.status(400).send({
                            code: 400,
                            message: "User Not Found Please Register First",
                            stack: "Error: Please create Account"
                        }); 
                    }
                    else if(email==shopUser.email && isMatch){
                    //Generating Token Here
                        const token = jwt.sign(
                            { sub: savedUser._id,type: "access" },
                            process.env.JWT_SECRET_KEY,
                            { expiresIn: "1d" }
                        );
                        let expiryDate = "";
                        jwt.verify(token,  process.env.JWT_SECRET_KEY, (err, decoded) => {
                            if (err) {
                                //console.error('Token verification failed:', err);
                            }
                            else {
                                expiryDate = new Date(decoded.exp * 1000);
                            }
                        });
            
                        let obj = {
                            "user" : savedUser,
                            "token":token,
                            "expires":expiryDate
                        };
                        return res.send(obj);
                    }
                    else{
                        return res.status(400).send({
                            code: 400,
                            message: "Email Or Password Wrong Please Check",
                            stack: "Error: Email Or Password Wrong"
                        }); 
                    }

                }
                else{
                    return res.status(400).send({
                        code: 400,
                        message: "User Not Found Please Register First",
                        stack: "Error: Please create Account"
                    }); 
                }
            }
        }
        else{
            return res.status(400).send({
                code: 400,
                message: "Re-Captcha Verification Failed",
                stack: "Error: Please Provide Valid Captcha"
            });
        }
    };

    static loginWithGoogle = async(req,res)=>{
        const {captcha} = req.body;
        const {email} = req.body;
        const { token } = req.body;
        const isRecaptchaValid = await this.verifyRecaptcha(captcha);

        const {success} = isRecaptchaValid;
        if(success){
            try{
                await client.verifyIdToken({
                    idToken: token,
                    audience: CLIENT_ID
                });
                let user = await shopUserModel.findOne({email:email,deleted:false}).select("-password");
                if(!user){
                    return res.status(400).send({
                        message:"Please Register First"
                    });
                }
                const mytoken = jwt.sign(
                    { sub: user,type: "access" },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: "1d" }
                );
                let expiryDate = "";
                jwt.verify(mytoken,  process.env.JWT_SECRET_KEY, (err, decoded) => {
                    if (err) {
                        //console.error('Token verification failed:', err);
                    }
                    else {
                        expiryDate = new Date(decoded.exp * 1000);
                    }
                });

                let obj = {
                    "user" : user,
                    "token":mytoken,
                    "expires":expiryDate
                };
                return res.send(obj);

            }
            catch(err){
                return res.status(400).send({message:"Not Found"});
            }
        }
        else{
            res.status(400).send({message:"Captcha Verification Failed"});
        }

    };

    static changePassword = async(req,res)=>{
        const {old_password,new_password} = req.body;
        if(old_password=="" || old_password==undefined || old_password==null){
            return res.status(400).send({message:"Please Provide Old Password"});
        }
        else if(new_password=="" || new_password==undefined || new_password==null){
            return res.status(400).send({message:"Please Enter New Password"});
        }
        else{
            try{
                let salt = await bcrypt.genSalt(10);
                let newHashPassword = await bcrypt.hash(new_password,salt);

                await sellerModel.findByIdAndUpdate(req.seller._id,{
                    $set:{
                        password:newHashPassword
                    }
                });
                return res.send({message:"Password Changed Successfully"});
            }
            catch(err){
                return res.status(400).send({
                    code: 400,
                    message: "Unable To Change Password",
                    stack: "Error: Something went wrong On Server"
                });
            }
        }
    };

    static forgotPassword= async(req,res)=>{
        const {email} = req.body;
        if(email=="" || email==undefined || email==null){
            return res.status(400).send({message:"Please Provide Email"});
        }
        else{
            let seller = await sellerModel.findOne({email:email});
            if(seller){
                const token = await jwt.sign(
                    { sub: seller._id,type: "resetPassword" },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: "15m" }
                );
                let link = `http://localhost:4200/auth/reset-password?token=${token}`;
                const mailOptions = {
                    from: "ajayshinde10000@gmail.com",
                    to: seller.email,
                    subject: "Reset Password",
                    text:`Dear user,
                      To reset your password, click on this link: ${link}
                      If you did not request any password resets, then ignore this email.` 
                };
                transporter.sendMail(mailOptions)
                    // eslint-disable-next-line no-unused-vars
                    .then((info) => {
                        // console.log('Email sent: ' + info.response);
                        return res.send(`Email Sent On Registered Mail Please Check: ${token}`);
                    })
                    // eslint-disable-next-line no-unused-vars
                    .catch((error) => {
                        return res.status(400).send({
                            code: 400,
                            message: "Unable To Send Email Please Provide Valid Email",
                            stack: "Error: Unable to generate link. Sorry for the inconvennience"
                        });
                    });

            }
            else{
                return res.status(400).send({
                    code: 400,
                    message: "User Does Not Found with this Email Please check",
                    stack: "Error: User Not Found"
                });
            }
        }
    };

    static resetPassword = async(req,res)=>{
    //console.log("Reset Password works");
        const {token, password} = req.body;
        if(token=="" || token == undefined || token == null){
            return res.status(400).send({
                code: 400,
                message: "Token Not Found",
                stack: "Error: Token Not Found"
            });
        }
        else if(password=="" || password==undefined || password==null){
            return res.status(400).send({
                code: 400,
                message: "Password Is Required",
                stack: "Error: Password is not to be empty"
            });
        }
        else{
            try{
                const {sub} = jwt.verify(token,process.env.JWT_SECRET_KEY);
                await sellerModel.findById(sub).select("-password");
                //console.log(seller);
                let salt = await bcrypt.genSalt(10);
                let newHashPassword = await bcrypt.hash(password,salt);

                await sellerModel.findByIdAndUpdate(sub,{
                    $set:{
                        password:newHashPassword
                    }
                });
                return res.send({message:"Password reset Successfull"});
            }
            catch(err){
                return res.status(400).send({
                    code: 400,
                    message: "Provided Token Is not a valid token",
                    stack: "Error: Please Resend Email For Verification"
                });
            }
        }
    };

    static sendVerificationEmail = async(req,res)=>{
        try{
            const token = jwt.sign(
                { sub: req.seller._id,type: "verifyEmail" },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "15m" }
            );
   
            let link = `http://localhost:4200/auth/verify-email?token=${token}`;
            const mailOptions = {
                from: "ajayshinde10000@gmail.com",
                to: req.seller.email,
                subject: "Email Verification",
                text:`Dear user,
                  To verify your email, click on this link: ${link}
                  If you did not create an account, then ignore this email` 
            };
            transporter.sendMail(mailOptions)
                // eslint-disable-next-line no-unused-vars
                .then((info) => {
                    //console.log('Email sent: ' + info.response);
                    return res.send(`Email Sent On Registered Mail Please Check: ${token}`);
                })
                // eslint-disable-next-line no-unused-vars
                .catch((error) => {
                    //console.log("Email Error")
                    return res.status(400).send({
                        code: 400,
                        message: "Unable To Send Email Please Provide Valid Email",
                        stack: "Error: Unable to generate link. Sorry for the inconvennience"
                    });
                });

        }
        catch(err){
            return res.status(400).send({
                code: 400,
                message: "Unable To Send Email Please Provide Valid Email",
                stack: "Error: Unable to generate link. Sorry for the inconvennience"
            });
        }
    };

    static verifyEmail = async(req,res)=>{
        let token = req.query.token;
        if(token=="" || token == undefined || token ==null){
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Token",
                stack: "Error: Token not Found"
            });
        }
        else{
            try{
                let {sub} = await jwt.verify(token,process.env.JWT_SECRET_KEY);
                await sellerModel.findByIdAndUpdate(sub,{
                    $set:{
                        "isEmailVerified":true
                    }
                });
                res.send("Email verified Successfully");
            }
            catch(err){
                return res.status(400).send({
                    code: 400,
                    message: "Please Provide Valid Token",
                    stack: "Error: Token not Found"
                });
            }  
        }
    };

    static selfCall = async(req,res)=>{
        try{
            return res.send(req.shopUser);
        }
        catch(err){
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Token",
                stack: "Error: Token not Found"
            });
        }
    };

    static userSendForgotPasswordLink = async(req,res)=>{
        try{
            const {email} = req.body;
            let user = await shopUserModel.findOne({email:email});

            if(!user){
                res.status(400).send({message:"User Not Found"});
            }

            if(user){
                const token = await jwt.sign(
                    { sub: user._id,type: "resetPassword" },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: "15m" }
                );
                let link = `http://localhost:4200/shop/auth/reset-password?token=${token}`;
                // eslint-disable-next-line no-unused-vars
                const mailOptions = {
                    from: "ajayshinde10000@gmail.com",
                    to: user.email,
                    subject: "Reset Password",
                    text:`Dear user,
                      To reset your password, click on this link: ${link}
                      If you did not request any password resets, then ignore this email.` 
                };

                let saveEmail = new emailsModel({
                    name:user.name,
                    email:email,
                    description:`Dear user,
                                 To reset your password, click on this link: ${link}
                                 If you did not request any password resets, then ignore this email.`,
                    link:link,
                    type:"reset"
                });
                await saveEmail.save();
                return res.send({message:"Reset Password Email Sent On Your Email"});
            }
        }
        catch(err){
            console.log(err);
            return res.status(400).send({message:"Error Occurred"});
        }
    };

    static userResetPassword = async(req,res)=>{
        const {password} = req.body;
        const {token} = req.query;
        if(token=="" || token == undefined || token == null){
            return res.status(400).send({
                code: 400,
                message: "Token Not Found",
                stack: "Error: Token Not Found"
            });
        }
        else if(password=="" || password==undefined || password==null){
            return res.status(400).send({
                code: 400,
                message: "Password Is Required",
                stack: "Error: Password is not to be empty"
            });
        }
        else{
            try{
                const {sub} = await jwt.verify(token,process.env.JWT_SECRET_KEY);
                await shopUserModel.findById(sub).select("-password");
                let salt = await bcrypt.genSalt(10);
                let newHashPassword = await bcrypt.hash(password,salt);

                await shopUserModel.findByIdAndUpdate(sub,{
                    $set:{
                        password:newHashPassword
                    }
                });
                return res.send({message:"Password reset Successfull"});

            }
            catch(err){
                return res.status(400).send({
                    code: 400,
                    message: "Link expired Please Resend Email",
                    stack: "Error: Please Resend Email For Verification"
                });
            }
        }
    }; 
}

export default ShopAuthController;
