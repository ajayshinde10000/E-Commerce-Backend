import Joi from "joi";

const login = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    captcha: Joi.string().required()
});

const userRegister = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().min(8),
    captcha:Joi.string().required()
});

const changePassword = Joi.object({
    old_password : Joi.string().required(),
    new_password : Joi.string().required()
});

let sellerRegister = Joi.object({
    name: Joi.string().required().min(3),
    email:Joi.string().email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] }}),
    password: Joi.string().min(8),
    company: Joi.string().required().min(3),
    captcha: Joi.string()
});

let resetPassword = Joi.object({
    token:Joi.string().required(),
    password: Joi.string().required().min(8)
});

let createProduct = Joi.object({
    name:Joi.string().required(),
    description:Joi.string().required(), 
    price:Joi.number().required(),
    category:Joi.string().required()
});

let address = Joi.object({
    street: Joi.string().required(),
    addressLine2: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pin: Joi.number().required()
});

let addRating = Joi.object({
    title:Joi.string().required(),
    description:Joi.string().required().min(15),
    stars:Joi.number().required().min(1).max(5)
});

let updateRating = Joi.object({
    title:Joi.string().required(),
    description:Joi.string().required().min(15),
    stars:Joi.number().required().min(1).max(5)
});

let cardDetails = Joi.object({
    nameOnCard: Joi.string().required(),
    cardNumber: Joi.number().required(),
    expiry: Joi.string().required(),
    cvv: Joi.number()
});

let updteUserInfo = Joi.object({
    name: Joi.string().required().optional(),
    password: Joi.string().required().optional().min(8),
    email: Joi.string().email().optional(),
    role: Joi.string().valid("admin", "user").required().optional()
});

let updateUserRole = Joi.object({
    role: Joi.string().valid("admin", "user").required()
});

let updateCompanyInfo = Joi.object({
    email: Joi.string().email().required(),
    name:Joi.string().required()
});


let joiMiddeleware = {
    login,userRegister,sellerRegister,changePassword,resetPassword,createProduct,address,addRating,updateRating,
    cardDetails,updteUserInfo,updateUserRole,updateCompanyInfo
};



export default joiMiddeleware;