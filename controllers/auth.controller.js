/* eslint-disable no-undef */
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import asyncErrorHandler from "./asyncErrorHandler.js";
import CustomError from "../Middeleware/customError.js";
import joiModdeleware from "../Middeleware/joyMiddeleware.js";

import models from "../models/index.model.js";

const emailModel = models.emailModel;
const organizationModel = models.organizationModel;
const sellerModel = models.sellerModel;

import axios from "axios";

import nodemailer from "nodemailer";

const CLIENT_ID =
  "574427248919-k87r9tjbn5qkl74fdqvisk0p159ed176.apps.googleusercontent.com"; // Replace with your actual client ID
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
    static register = asyncErrorHandler(async (req, res, next) => {
        const { name, email, password, company } = req.body;
        const seller = await sellerModel.findOne({ email: email });
        let isCompanyMatch = await organizationModel.findOne({
            "_org.name": company
        });

        if (seller) {
            next(
                new CustomError(
                    "There is already an account with this email address",
                    400
                )
            );
        }
        else if (isCompanyMatch) {
            next(
                new CustomError(
                    "There is already an company registered with this name",
                    400
                )
            );
        }
        else {
            await joiModdeleware.sellerRegister.validateAsync(req.body);
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            let organization = await organizationModel.create({
                email: email,
                name: company
            });

            const doc = new sellerModel({
                name: name,
                _org: organization._id,
                email: email,
                password: hashPassword,
                role: "admin",
                isEmailVerified: false,
                deleted: false
            });
            await doc.save();
            let savedSeller = await sellerModel
                .findOne({ email: email })
                .select("-users")
                .select("-password");
            //Generating Token Here
            const token = jwt.sign(
                { sub: savedSeller._id, type: "access" },
                // eslint-disable-next-line no-undef
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1d" }
            );
            let expiryDate = "";
            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err) {
                    //console.error('Token verification failed:', err);
                }
                else {
                    expiryDate = new Date(decoded.exp * 1000);
                }
            });

            let obj = {
                user: savedSeller,
                token: token,
                expires: expiryDate
            };
            return res.send(obj);
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

    static login = asyncErrorHandler(async (req, res, next) => {
        const { captcha } = req.body;
        const isRecaptchaValid = await this.verifyRecaptcha(captcha);

        const { success } = isRecaptchaValid;
        const { email, password } = req.body;
        if (success) {
            await joiModdeleware.login.validateAsync(req.body);
            let seller = await sellerModel.findOne({ email: email });

            if (!seller) {
                next(new CustomError("User Not Found Please Register First", 400));
            }

            if (seller.deleted) {
                next(new CustomError("User Not Found Please Register First", 400));
            }
            else if (seller) {
                const isMatch = await bcrypt.compare(password, seller.password);
                let savedSeller = await sellerModel.aggregate([
                    {
                        $match: {
                            email: email
                        }
                    },
                    {
                        $lookup: {
                            from: "organizations",
                            localField: "_org",
                            foreignField: "_id",
                            as: "_org"
                        }
                    },
                    {
                        $set: {
                            _org: { $arrayElemAt: ["$_org", 0] }
                        }
                    },
                    {
                        $project: {
                            createdAt: 0,
                            updatedAt: 0,
                            "_org.createdAt": 0,
                            "_org.updatedAt": 0,
                            "_org.__v": 0
                        }
                    }
                ]);

                if (email == seller.email && isMatch) {
                    //Generating Token Here
                    const token = jwt.sign(
                        { sub: savedSeller[0]._id, type: "access" },
                        // eslint-disable-next-line no-undef
                        process.env.JWT_SECRET_KEY,
                        { expiresIn: "1d" }
                    );
                    let expiryDate = "";
                    // eslint-disable-next-line no-undef
                    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                        if (err) {
                            //console.error('Token verification failed:', err);
                            next(new CustomError("Error Ocuured", 400));
                        }
                        else {
                            expiryDate = new Date(decoded.exp * 1000);
                            //console.log('Token expiry date:', expiryDate);
                        }
                    });

                    let obj = {
                        user: savedSeller[0],
                        token: token,
                        expires: expiryDate
                    };
                    return res.send(obj);
                }
                else {
                    next(new CustomError("Email Or Password Wrong", 400));
                }
            }
        }
        else {
            next(new CustomError("Re-Captcha Verification Failed", 422));
        }
    });

    static changePassword = asyncErrorHandler(async (req, res, next) => {
        const { new_password, old_password } = req.body;
        const seller = await sellerModel.findById(req.seller._id);
        const isMatch = await bcrypt.compare(old_password, seller.password);
        await joiModdeleware.changePassword.validateAsync(req.body);
        try {
            if (!isMatch) {
                next(new CustomError("Old Password Does Not Match", 400));
            }

            let salt = await bcrypt.genSalt(10);
            let newHashPassword = await bcrypt.hash(new_password, salt);
            await sellerModel.findByIdAndUpdate(req.seller._id, {
                $set: {
                    password: newHashPassword
                }
            });
            return res.send({ message: "Password Changed Successfully" });
        }
        catch (err) {
            // console.log(err);
            next(new CustomError("Unable To Change Password", 400));
        }
    });

    static forgotPassword = asyncErrorHandler(async (req, res, next) => {
        const { email } = req.body;
        if (email == "" || email == undefined || email == null) {
            return res.status(400).send({ message: "Please Provide Email" });
        }
        else {
            let seller = await sellerModel.findOne({ email: email });
            if (seller) {
                try {
                    const token = jwt.sign(
                        { sub: seller._id, type: "resetPassword" },
                        // eslint-disable-next-line no-undef
                        process.env.JWT_SECRET_KEY,
                        { expiresIn: "15m" }
                    );
                    // let link = `https://ajay-ecom.netlify.app/auth/reset-password?token=${token}`;
                    let link = `http://localhost:4200/auth/reset-password?token=${token}`;
                    let saveEmail = new emailModel({
                        email: email,
                        description: `Dear user,
                                     To reset your password, click on this link: ${link}
                                     If you did not request any password resets, then ignore this email.`,
                        link: link,
                        type: "reset"
                    });
                    await saveEmail.save();
                    return res.send(saveEmail);
                }
                catch (err) {
                    next(new CustomError("Error Occurred", 400));
                }
            }
            else {
                next(
                    new CustomError(
                        "User Does Not Found with this Email Please check",
                        400
                    )
                );
            }
        }
    });

    // eslint-disable-next-line no-unused-vars
    static resetPassword = asyncErrorHandler(async (req, res, next) => {
        const { password } = req.body;
        const { token } = req.query;
        await joiModdeleware.resetPassword.validateAsync({ token, password });
        // eslint-disable-next-line no-undef
        const { sub } = jwt.verify(token, process.env.JWT_SECRET_KEY);
        await sellerModel.findById(sub).select("-password");
        //console.log(seller);
        let salt = await bcrypt.genSalt(10);
        let newHashPassword = await bcrypt.hash(password, salt);
        await sellerModel.findByIdAndUpdate(sub, {
            $set: {
                password: newHashPassword
            }
        });
        return res.status(201).send({ message: "Password reset Successfull" });
    });

    static sendVerificationEmail = asyncErrorHandler(async (req, res, next) => {
        try {
            const token = jwt.sign(
                { sub: req.seller._id, type: "verifyEmail" },
                // eslint-disable-next-line no-undef
                process.env.JWT_SECRET_KEY,
                { expiresIn: "15m" }
            );
            let link = `http://localhost:4200/auth/verify-email?token=${token}`;
            let saveEmail = new emailModel({
                name:req.seller.name,
                email: req.seller.email,
                description: `Dear user,
                             To Verify your Email, click on this link: ${link}
                             If you did not request any Email Verification, then ignore this email.`,
                link: link,
                type: "verify"
            });
            await saveEmail.save();
            return res.send({
                message:
          "Email Verification Link Will Be Sent On Your Email Please Check"
            });
        }
        catch (err) {
            next(
                new CustomError("Unable To Send Email Please Provide Valid Email", 400)
            );
        }
    });

    static verifyEmail = asyncErrorHandler(async (req, res) => {
        let token = req.query.token;
        if (token == "" || token == undefined || token == null) {
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Token",
                stack: "Error: Token not Found"
            });
        }
        else {
            // eslint-disable-next-line no-undef
            let { sub } = jwt.verify(token, process.env.JWT_SECRET_KEY);
            await sellerModel.findByIdAndUpdate(sub, {
                $set: {
                    isEmailVerified: true
                }
            });
            res.send({ message: "Email verified Successfully" });
        }
    });

    static selfCall = async (req, res) => {
        return res.send(req.seller);
    };

    static signInWithGoogle = async (req, res, next) => {
        const { captcha } = req.body;
        const { email } = req.body;
        const { token } = req.body;

        //console.log(req.body,"From Body")

        //console.log(captcha);
        const isRecaptchaValid = await this.verifyRecaptcha(captcha);

        const { success } = isRecaptchaValid;
        if (success) {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: CLIENT_ID
            });

            ticket.getPayload();
            let user = await sellerModel
                .findOne({ email: email, deleted: false })
                .select("-password");

            if (!user) {
                return res.status(400).send({
                    message: "Please Register First"
                });
            }

            const mytoken = jwt.sign(
                { sub: user, type: "access" },
                // eslint-disable-next-line no-undef
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1d" }
            );
            let expiryDate = "";
            // eslint-disable-next-line no-undef
            jwt.verify(mytoken, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err) {
                    //console.error('Token verification failed:', err);
                }
                else {
                    expiryDate = new Date(decoded.exp * 1000);
                    //console.log('Token expiry date:', expiryDate);
                }
            });

            let obj = {
                user: user,
                token: mytoken,
                expires: expiryDate
            };
            return res.send(obj);
        }
        else {
            // res.status(400).send({message:"Captcha Verification Failed"});
            next(new CustomError("Captcha Verification Failed", 400));
        }

    //return res.send({message:"Sign In With Google Works"})
    };
}

export default AuthController;
