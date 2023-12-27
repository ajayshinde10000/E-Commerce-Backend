import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
    {
        nameOnCard: {
            type: String,
            required:true
        },
        cardNumber: {
            type:Number,
            required:true
        },
        expiry: {
            type:String,
            required:true
        },
        cvv: {
            type:Number,
            required:true
        },
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {timestamps:true}
);

const cardsModel = mongoose.model("Card",cardSchema);
export default cardsModel;