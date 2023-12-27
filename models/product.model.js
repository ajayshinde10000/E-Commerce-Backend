import mongoose from "mongoose";

const productsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        images: {
            type: Array, // Array of image filenames
            required: true
        },
        stock:{
            type:Number,
            default:1
        },
        _org: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            }
        },
        deals:[{
            type:mongoose.Types.ObjectId,
            ref:"deals"
        }],
        // reviews:[{
        //     type:mongoose.Types.ObjectId,
        //     ref:"Rating"
        // }],
        deleted:{
            type:Boolean,
            required: true,
            default:false
        },
        sellerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Seller"
        }
    }
);

const productsModel = mongoose.model("products",productsSchema);

export default productsModel;