import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    profilePicture:{
        type:Object,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    stars:{
        type:Number,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"products"
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    deleted: {
        type: Boolean,
        required: true
    }
},{timestamps:true});

const ratingModule = mongoose.model("Rating",ratingSchema);

export default ratingModule;