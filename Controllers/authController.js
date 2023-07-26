/* eslint-disable no-undef */
import sellerModel from "../Models/seller.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import emailModel from "../Models/Emails.js";
import { OAuth2Client } from "google-auth-library";

import axios from "axios";

import nodemailer from "nodemailer";

const CLIENT_ID = "574427248919-k87r9tjbn5qkl74fdqvisk0p159ed176.apps.googleusercontent.com"; // Replace with your actual client ID
const client = new OAuth2Client(CLIENT_ID);

// eslint-disable-next-line no-unused-vars
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "ajayshinde10000@gmail.com",
        pass: "yvjfaicpumlmgvcp"
    }
});

class AuthController {
    static register = async (req, res) => {
        const { name, email, password, company } = req.body;
        const seller = await sellerModel.findOne({ email: email });

        //console.log(req.query,"From Params");

        if (seller) {
            let obj = {
                code: 400,
                message: "There is already an account with this email address",
                stack: "Error: There is already an account with this email address"
            };
            return res.send(obj);
        }
        else {

            if(name==""){
                return res.send({
                    code: 400,
                    message: "\"name\" is not allowed to be empty",
                    stack: "Error: name is not allowed to be empty"
                });
            }
            else if(email == ""){
                return res.send({
                    code: 400,
                    message: "\"email\" is not allowed to be empty",
                    stack: "Error: email is not allowed to be empty"
                });
            }
            else if(password==""){
                return res.send({
                    code: 400,
                    message: "\"Password\" is not allowed to be empty",
                    stack: "Error: password is not allowed to be empty"
                });
            }
            else if(company==""){
                return res.send({
                    code: 400,
                    message: "\"company\" is not allowed to be empty",
                    stack: "Error: Company Name is not allowed to be empty"
                });
            }
            else{
                try{
                    const salt = await bcrypt.genSalt(10);
                    const hashPassword = await bcrypt.hash(password, salt);
                    const doc = new sellerModel({
                        name: name,
                        _org: {
                            name: company,
                            email: email
                        },
                        email: email,
                        password:hashPassword,
                        role: "admin",
                        isEmailVerified: false,
                        deleted: false
                    });
                    await doc.save();
                    let savedSeller = await sellerModel.findOne({ email: email }).select("-users").select("-password");
               
                    // await sellerModel.findByIdAndUpdate(savedSeller._id,{
                    //     $set:{
                    //         users:[savedSeller]
                    //     }
                    // })
        
                    //Generating Token Here
                    const token = jwt.sign(
                        { sub: savedSeller._id,type: "access" },
                        // eslint-disable-next-line no-undef
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
                            //console.log('Token expiry date:', expiryDate);
                        }
                    });
        
                    let obj = {
                        "user" : savedSeller,
                        "token":token,
                        "expires":expiryDate
                    };
                    return res.send(obj);
        
                }
                catch(err){
                //console.log("Error",err);
                    return res.send("Error Occurrred");
                }
            }
        }
    };

    static verifyRecaptcha = async (response) => {
        const secretKey = "6LcDrP0mAAAAALRFSn3BceF6Vr1nckEoyNPG1o0C";
        try {
            //console.log(response);
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
            //console.log('reCAPTCHA verification failed:', error.message);
            return false;
        }
    };

    static login = async(req,res)=>{

        const {captcha} = req.body;
        const isRecaptchaValid = await this.verifyRecaptcha(captcha);

        const {success} = isRecaptchaValid;
        if(success){
            //console.log(success,"From Login");
        }

        const {email,password} = req.body;
        if(success){
            try{
                if(email!="" && password!=""){
                    let seller = await sellerModel.findOne({email:email});
                    if(seller.deleted){
                        return res.status(400).send({
                            code: 400,
                            message: "User Not Found Please Register First",
                            stack: "Error: Please create Account"
                        }); 
                    }
                    else if(seller){
                        const isMatch = await bcrypt.compare(password, seller.password);
                        let savedSeller = await sellerModel.findOne({email:email});
                        if(email==seller.email && isMatch){
                            //Generating Token Here
                            const token = jwt.sign(
                                { sub: savedSeller._id,type: "access" },
                                // eslint-disable-next-line no-undef
                                process.env.JWT_SECRET_KEY,
                                { expiresIn: "1d" }
                            );
                            let expiryDate = "";
                            // eslint-disable-next-line no-undef
                            jwt.verify(token,  process.env.JWT_SECRET_KEY, (err, decoded) => {
                                if (err) {
                                    //console.error('Token verification failed:', err);
                                }
                                else {
                                    expiryDate = new Date(decoded.exp * 1000);
                                    //console.log('Token expiry date:', expiryDate);
                                }
                            });
            
                            let obj = {
                                "user" : savedSeller,
                                "token":token,
                                "expires":expiryDate
                            };
                            return res.send(obj);
                        }
                        else{
                            return res.status(400).send({message:"Email Or Password Wrong"}); 
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
            catch(err){
                return res.status(400).send({
                    code: 400,
                    message: "Please Register first",
                    stack: "Error: Please Enter Valid Details"
                });
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

    static changePassword = async(req,res)=>{
        const {old_password,new_password} = req.body;
        //console.log(req.body,"From Change Password")
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
                //console.log(req.seller);

                await sellerModel.findByIdAndUpdate(req.seller._id,{
                    $set:{
                        password:newHashPassword
                    }
                });
                return res.send({message:"Password Changed Successfully"});
            }
            catch(err){
                //console.log(err)
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
            return res.send("Please Provide Email");
        }
        else{
            let seller = await sellerModel.findOne({email:email});
            if(seller){
                try{
                    const token = jwt.sign(
                        { sub: seller._id, type: "resetPassword" },
                        // eslint-disable-next-line no-undef
                        process.env.JWT_SECRET_KEY,
                        { expiresIn: "15m" }
                    );
                    let link = `https://ajay-ecom.netlify.app/auth/reset-password?token=${token}`;
                    // eslint-disable-next-line no-unused-vars
                    const mailOptions = {
                        from: "ajayshinde10000@gmail.com",
                        to: seller.email,
                        subject: "Reset Password",
                        text:`Dear user,
                    To reset your password, click on this link: ${link}
                    If you did not request any password resets, then ignore this email.` 
                    };
                    //   transporter.sendMail(mailOptions)
                    // .then((info) => {
                    //   console.log('Email sent: ' + info.response);
                    //   return res.send(`Email Sent On Registered Mail Please Check: ${token}`);
                    // })
                    // .catch((error) => {
                    //   return res.send({
                    //       code: 400,
                    //       message: "Unable To Send Email Please Provide Valid Email",
                    //       stack: "Error: Unable to generate link. Sorry for the inconvennience",
                    //   })
                    // });

                    let saveEmail = new emailModel({
                        email:email,
                        description:`Dear user,
      To reset your password, click on this link: ${link}
      If you did not request any password resets, then ignore this email.`,
                        link:link,
                        type:"reset"
                    });



                    // let doc = new resetPasswordModel({
                    //   email:email,
                    //   description:`Dear user,
                    //                To reset your password, click on this link: ${link}
                    //                If you did not request any password resets, then ignore this email.`
                    // }) 

                    //await doc.save();
                    await saveEmail.save();
                    return res.send(saveEmail);

                }
                catch(err){
                    return res.send({
                        code: 400,
                        message: "Error Occurrred",
                        stack: "Error: Unable to send email"
                    });
                }


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
    //console.log(req.query,"Reset Password works");
        const { password} = req.body;
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
                // eslint-disable-next-line no-undef
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
                //console.log("Sending Response Successfully")
                return res.status(201).send({message:"Password reset Successfull"});

            }
            catch(err){
                //console.log("Error Occured",err)
                return res.status(400).send({
                    code: 400,
                    message: "Provided Token Is not a valid token",
                    stack: "Error: Please Resend Email For Verification"
                });
            }  
        }
    };

    static sendVerificationEmail = async(req,res)=>{
    //console.log(req.seller);
        try{
            const token = jwt.sign(
                { sub: req.seller._id, type: "verifyEmail" },
                // eslint-disable-next-line no-undef
                process.env.JWT_SECRET_KEY,
                { expiresIn: "15m" }
            );
   
            let link = `https://ajay-ecom.netlify.app/auth/verify-email?token=${token}`;

            let saveEmail = new emailModel({
                email:req.seller.email,
                description:`Dear user,
          To Verify your Email, click on this link: ${link}
          If you did not request any Email Verification, then ignore this email.`,
                link:link,
                type:"verify"
            });
        

            // eslint-disable-next-line no-unused-vars
            const mailOptions = {
                from: "ajayshinde10000@gmail.com",
                to: req.seller.email,
                subject: "Email Verification",
                text:`Dear user,
            To Verify your email, click on this link: ${link}
            If you did not request any password resets, then ignore this email.` 
            };
            //   transporter.sendMail(mailOptions)
            // .then((info) => {
            //   console.log('Email sent: ' + info.response);
            //   return res.send(`Email Sent On Registered Mail Please Check: ${token}`);
            // })
            // .catch((error) => {
            //   console.log("Email Error")
            //   return res.send({
            //       code: 400,
            //       message: "Unable To Send Email Please Provide Valid Email",
            //       stack: "Error: Unable to generate link. Sorry for the inconvennience",
            //   })
            // });


            // let doc = new emailVerificationModel({
            //   email:req.seller.email,
            //   description:`Dear user,
            //                To reset your password, click on this link: ${link}
            //                If you did not request any password resets, then ignore this email.`
            // }) 

            // await doc.save();

            await saveEmail.save();

            return res.send({message:"Email Verification Link Will Be Sent On Your Email Please Check"});

        }
        catch(err){
        //console.log(err)
            return res.send({
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
                // eslint-disable-next-line no-undef
                let {sub} = jwt.verify(token, process.env.JWT_SECRET_KEY);
                await sellerModel.findByIdAndUpdate(sub,{
                    $set:{
                        "isEmailVerified":true
                    }
                });
                //console.log(seller);
                res.send({message:"Email verified Successfully"});
            }
            catch(err){
                return res.send({
                    code: 400,
                    message: "Please Provide Valid Token",
                    stack: "Error: Token not Found"
                });
            }  
        }
    };

    static selfCall = async(req,res)=>{
        try{
            return res.send(req.seller);
        }
        catch(err){
            return res.status(404).send({
                code: 400,
                message: "Please Provide Valid Token",
                stack: "Error: Token not Found"
            });
        }
    };

    static signInWithGoogle = async(req,res)=>{

        const {captcha} = req.body;
        const {email} = req.body;
        const { token } = req.body;

        //console.log(req.body,"From Body")

        //console.log(captcha);
        const isRecaptchaValid = await this.verifyRecaptcha(captcha);

        const {success} = isRecaptchaValid;
        if(success){
            try{
                const ticket = await client.verifyIdToken({
                    idToken: token,
                    audience: CLIENT_ID
                });
    
                ticket.getPayload();
                let user = await sellerModel.findOne({email:email}).select("-password");

                if(!user){
                    return res.status(400).send({
                        message:"Please Register First"
                    });
                }

                const mytoken = jwt.sign(
                    { sub: user,type: "access" },
                    // eslint-disable-next-line no-undef
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: "1d" }
                );
                let expiryDate = "";
                // eslint-disable-next-line no-undef
                jwt.verify(mytoken,  process.env.JWT_SECRET_KEY, (err, decoded) => {
                    if (err) {
                        //console.error('Token verification failed:', err);
                    }
                    else {
                        expiryDate = new Date(decoded.exp * 1000);
                        //console.log('Token expiry date:', expiryDate);
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
                //console.log(err);
                return res.status(400).send({message:"Not Found"});
            }
        }
        else{
            res.status(400).send({message:"Captcha Verification Failed"});
        }

    //return res.send({message:"Sign In With Google Works"})
    };
}

export default AuthController;
