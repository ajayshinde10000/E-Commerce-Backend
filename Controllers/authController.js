import sellerModel from "../Models/seller.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import e from "express";
import emailVerificationModel from "../Models/emailVerification.js";
import resetPasswordModel from "../Models/resetPassword.js";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "ajayshinde10000@gmail.com",
    pass: "yvjfaicpumlmgvcp",
  },
});

class AuthController {
  static register = async (req, res) => {
    const { name, email, password, company } = req.body;
    const seller = await sellerModel.findOne({ email: email });

    console.log(req.query,"From Params");

    if (seller) {
      let obj = {
        code: 400,
        message: "There is already an account with this email address",
        stack: "Error: There is already an account with this email address",
      };
     return res.send(obj);
    } else {

        if(name==""){
            return res.send({
                code: 400,
                message: "\"name\" is not allowed to be empty",
                stack: "Error: name is not allowed to be empty",
              })
        }
        else if(email == ""){
           return res.send({
                code: 400,
                message: "\"email\" is not allowed to be empty",
                stack: "Error: email is not allowed to be empty",
              })
        }
        else if(password==""){
            return res.send({
                code: 400,
                message: "\"Password\" is not allowed to be empty",
                stack: "Error: password is not allowed to be empty",
              })
        }
        else if(company==""){
            return res.send({
                code: 400,
                message: "\"company\" is not allowed to be empty",
                stack: "Error: Company Name is not allowed to be empty",
              })
        }
        else{
            try{
                const salt = await bcrypt.genSalt(10);
                const hashPassword = await bcrypt.hash(password, salt);
                const doc = new sellerModel({
                  name: name,
                  _org: {
                    name: company,
                    email: email,
                  },
                  email: email,
                  password:hashPassword,
                  role: "admin",
                  isEmailVerified: false,
                  deleted: false,
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
                    { sub: savedSeller._id,type: 'access' },
                      process.env.JWT_SECRET_KEY,
                    { expiresIn: "1d" }
                );
                let expiryDate = "";
                jwt.verify(token,  process.env.JWT_SECRET_KEY, (err, decoded) => {
                    if (err) {
                      console.error('Token verification failed:', err);
                    } else {
                      expiryDate = new Date(decoded.exp * 1000);
                      console.log('Token expiry date:', expiryDate);
                    }
                });
        
                let obj = {
                    "user" : savedSeller,
                    "token":token,
                    "expires":expiryDate
                }
               return res.send(obj);
        
             }catch(err){
                console.log("Error",err);
                return res.send("Error Occurrred")
             }
        }
    }
  };

  static login = async(req,res)=>{
    const {email,password} = req.body;
    let captchaStatus = req.query.captcha;
    console.log(captchaStatus == "false");
    if(captchaStatus=="false"){

        if(email!="" && password!=""){
            let seller = await sellerModel.findOne({email:email});
            if(seller){
                const isMatch = await bcrypt.compare(password, seller.password);
                let savedSeller = await sellerModel.findOne({email:email});
                if(email==seller.email && isMatch){
                    //Generating Token Here
                    const token = jwt.sign(
                        { sub: savedSeller._id,type: 'access' },
                          process.env.JWT_SECRET_KEY,
                        { expiresIn: "1d" }
                    );
                    let expiryDate = "";
                    jwt.verify(token,  process.env.JWT_SECRET_KEY, (err, decoded) => {
                        if (err) {
                          console.error('Token verification failed:', err);
                        } else {
                          expiryDate = new Date(decoded.exp * 1000);
                          console.log('Token expiry date:', expiryDate);
                        }
                    });
            
                    let obj = {
                        "user" : savedSeller,
                        "token":token,
                        "expires":expiryDate
                    }
                   return res.send(obj);
                }
                else{
                  return res.send({
                        code: 400,
                        message: "Email Or Password Wrong Please Check",
                        stack: "Error: Email Or Password Wrong",
                    }) 
                }

            }
            else{
                return res.send({
                    code: 400,
                    message: "User Not Found Please Register First",
                    stack: "Error: Please create Account",
                }) 
            }
        }

        res.send("Login Works")
    }
    else{
       return res.send({
            code: 400,
            message: "Re-Captcha Verification Failed",
            stack: "Error: Please Provide Valid Captcha",
        })
    }
  };

  static changePassword = async(req,res)=>{
    const {old_password,new_password} = req.body;
    if(old_password=="" || old_password==undefined || old_password==null){
        return res.send("Please Provide Old Password");
    }
    else if(new_password=="" || new_password==undefined || new_password==null){
        return res.send("Please Enter New Password");
    }
    else{
        try{
            let salt = await bcrypt.genSalt(10);
            let newHashPassword = await bcrypt.hash(new_password,salt);

            await sellerModel.findByIdAndUpdate(req.seller._id,{
                $set:{
                    password:newHashPassword
                }
            })
            return res.send("Password Changed Successfully");
        }catch(err){
            return res.send({
                code: 400,
                message: "Unable To Change Password",
                stack: "Error: Something went wrong On Server",
            })
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
            const token = await jwt.sign(
              { sub: seller._id,type: 'resetPassword' },
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
                    If you did not request any password resets, then ignore this email.` ,
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


    let doc = new resetPasswordModel({
      email:email,
      description:`Dear user,
                   To reset your password, click on this link: ${link}
                   If you did not request any password resets, then ignore this email.`
    }) 

    await doc.save();
    return res.send(mailOptions);

          }catch(err){
            return res.send({
              code: 400,
              message: "Error Occurrred",
              stack: "Error: Unable to send email",
          })
          }


        }
        else{
            return res.send({
                code: 400,
                message: "User Does Not Found with this Email Please check",
                stack: "Error: User Not Found",
            })
        }
    }
  };

  static resetPassword = async(req,res)=>{
    console.log("Reset Password works");
    const {token, password} = req.body;
    if(token=="" || token == undefined || token == null){
        return res.send({
            code: 400,
            message: "Token Not Found",
            stack: "Error: Token Not Found",
        })
    }
    else if(password=="" || password==undefined || password==null){
        return res.send({
            code: 400,
            message: "Password Is Required",
            stack: "Error: Password is not to be empty",
        })
    }
    else{
        try{
            const {sub} = jwt.verify(token,process.env.JWT_SECRET_KEY);
            let seller = await sellerModel.findById(sub).select("-password");
            console.log(seller);
            let salt = await bcrypt.genSalt(10);
            let newHashPassword = await bcrypt.hash(password,salt);

            await sellerModel.findByIdAndUpdate(sub,{
                $set:{
                    password:newHashPassword
                }
            })
            return res.send("Password reset Successfull");

        }catch(err){
            return res.send({
                code: 400,
                message: "Provided Token Is not a valid token",
                stack: "Error: Please Resend Email For Verification",
            })
        }  
    }
  };

  static sendVerificationEmail = async(req,res)=>{
    console.log(req.seller);
    try{
        const token = await jwt.sign(
            { sub: req.seller._id,type: 'verifyEmail' },
              process.env.JWT_SECRET_KEY,
            { expiresIn: "15m" }
        );
   
        let link = `http://localhost:4200/auth/reset-password?token=${token}`;
        const mailOptions = {
            from: "ajayshinde10000@gmail.com",
            to: req.seller.email,
            subject: "Email Verification",
            text:`Dear user,
                  To verify your email, click on this link: ${link}
                  If you did not create an account, then ignore this email` ,
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


  let doc = new emailVerificationModel({
    email:req.seller.email,
    description:`Dear user,
                 To reset your password, click on this link: ${link}
                 If you did not request any password resets, then ignore this email.`
  }) 

  await doc.save();
  return res.send(mailOptions);

    }catch(err){
        console.log(err)
        return res.send({
            code: 400,
            message: "Unable To Send Email Please Provide Valid Email",
            stack: "Error: Unable to generate link. Sorry for the inconvennience",
        })
    }
  };

  static verifyEmail = async(req,res)=>{
    let token = req.query.token;
    if(token=="" || token == undefined || token ==null){
        return res.send({
            code: 400,
            message: "Please Provide Valid Token",
            stack: "Error: Token not Found",
        })
    }
    else{
        try{
            let {sub} = await jwt.verify(token,process.env.JWT_SECRET_KEY);
            let seller = await sellerModel.findByIdAndUpdate(sub,{
                $set:{
                    "isEmailVerified":true
                }
            })
            console.log(seller);
            res.send("Email verified Successfully")
        }catch(err){
            return res.send({
                code: 400,
                message: "Please Provide Valid Token",
                stack: "Error: Token not Found",
            })
        }  
    }
  };

  static selfCall = async(req,res)=>{
    try{
        return res.send(req.seller)
    }catch(err){
        return res.send({
            code: 400,
            message: "Please Provide Valid Token",
            stack: "Error: Token not Found",
        })
    }
   
  }

}

export default AuthController;
