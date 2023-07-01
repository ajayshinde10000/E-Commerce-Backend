import mongoose from "mongoose";

const reserPasswordSchema = new mongoose.Schema({
    email:String,
    description:String
},{timestamps:true});

const resetPasswordModel = mongoose.model('Reset-Password-Email',reserPasswordSchema);

export default resetPasswordModel;