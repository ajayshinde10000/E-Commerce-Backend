import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
    discount:{
        type:Number,
        required:true
    },
    ends:{
        type:String,
        required:true
    },
    sellerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Seller"
    },
    deleted:{
        type:Boolean,
        default:false
    }
},{timestamps:true});
const dealModal = mongoose.model("deal",dealSchema);
export default dealModal;